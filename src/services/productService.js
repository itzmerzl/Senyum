import api from '../utils/apiClient';

// Generate unique SKU
export const generateSKU = async () => {
  try {
    const products = await api.get('products');

    const validCodes = products.filter(prod =>
      prod.sku && prod.sku.startsWith('SKU')
    );

    const sequences = validCodes.map(prod => {
      const parts = prod.sku.split('-');
      return parseInt(parts[1]) || 0;
    });

    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSequence = (maxSequence + 1).toString().padStart(6, '0');

    return `SKU-${nextSequence}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    throw error;
  }
};

// Generate unique barcode
export const generateBarcodeNumber = async () => {
  try {
    // Generate 13-digit barcode starting with 899 (Indonesia)
    let barcode;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      barcode = `899${random}`;

      try {
        // Check if barcode exists
        const existing = await api.get(`products?barcode=${barcode}`);
        if (!existing || existing.length === 0) {
          return barcode; // Found unique barcode
        }
      } catch (error) {
        // If backend error (500), assume barcode doesn't exist and return it
        console.log('Barcode check failed, assuming unique:', error.message);
        return barcode;
      }

      attempts++;
    }

    // If max attempts reached, return the last generated barcode
    return barcode;
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Fallback: generate simple random barcode
    const fallback = `899${Date.now().toString().slice(-10)}`;
    return fallback;
  }
};

// Get all products with filters
export const getAllProducts = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
    if (filters.supplierId) queryParams.append('supplierId', filters.supplierId);
    if (filters.status) queryParams.append('isActive', filters.status === 'active' ? 'true' : 'false');

    const queryString = queryParams.toString();
    const endpoint = `products${queryString ? `?${queryString}` : ''}`;

    let products = await api.get(endpoint);

    // Low stock / Stock status filtering (Client-side)
    if (filters.stockStatus) {
      if (filters.stockStatus === 'low') {
        products = products.filter(p => p.stock <= p.minStock);
      } else if (filters.stockStatus === 'out') {
        products = products.filter(p => p.stock === 0);
      } else if (filters.stockStatus === 'safe') {
        products = products.filter(p => p.stock > p.minStock);
      }
    }

    // Get ALL categories AND suppliers - REMOVED (Backend now handles relations)
    // const [allCategories, allSuppliers] = await Promise.all([
    //   api.get('categories'),
    //   api.get('suppliers')
    // ]);

    // Enrich products with name getters if needed, but DO NOT overwrite objects
    const enrichedProducts = products.map(product => ({
      ...product,
      categoryName: product.category?.name || '-',
      supplierName: product.supplier?.name || '-',
      unitName: product.unit?.name || '-'
    }));

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return enrichedProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm) ||
        (p.barcode && p.barcode.includes(searchTerm))
      );
    }

    return enrichedProducts; // Already sorted by backend (ID desc)

  } catch (error) {
    console.error('❌ Error getting products:', error);
    throw error;
  }
};

// Get product by ID with related data
export const getProductById = async (id) => {
  try {
    const product = await api.get(`products/${id}`);
    if (!product) return null;

    // Get related data
    // Backend already includes relations, so we just map names for convenience if needed
    // DO NOT overwrite objects with strings
    if (product.category) {
      product.categoryName = product.category.name;
    }
    if (product.supplier) {
      product.supplierName = product.supplier.name;
    }
    if (product.unit) {
      product.unitName = product.unit.name;
    }

    return product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Get product by barcode
export const getProductByBarcode = async (barcode) => {
  try {
    const products = await api.get(`products?barcode=${barcode}`);
    return products[0] || null;
  } catch (error) {
    // Backend might not support barcode query parameter
    // Return null instead of throwing to allow graceful fallback
    console.log('Barcode check failed (non-critical):', error.message);
    return null;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    // Validate required fields
    if (!productData.name || !productData.name.trim()) {
      throw new Error('Nama produk wajib diisi');
    }

    if (!productData.categoryId) {
      throw new Error('Kategori wajib dipilih');
    }

    if (productData.purchasePrice === undefined || productData.purchasePrice === null) {
      throw new Error('Harga beli wajib diisi');
    }

    if (productData.sellingPrice === undefined || productData.sellingPrice === null) {
      throw new Error('Harga jual wajib diisi');
    }

    if (productData.stock === undefined || productData.stock === null) {
      throw new Error('Stok awal wajib diisi');
    }

    // Check for duplicate name
    const duplicateName = await api.get(`products?name=${productData.name.trim()}`);
    if (duplicateName.length > 0) {
      throw new Error('Nama produk sudah ada');
    }

    // Generate SKU if not provided
    if (!productData.sku || productData.sku.trim() === '') {
      productData.sku = await generateSKU();
    } else {
      // Check for duplicate SKU
      const existingSKU = await api.get(`products?sku=${productData.sku.trim()}`);
      if (existingSKU.length > 0) {
        throw new Error('SKU sudah digunakan');
      }
    }

    // Generate barcode if not provided
    if (!productData.barcode || productData.barcode.trim() === '') {
      productData.barcode = await generateBarcodeNumber();
    } else if (productData.barcode.trim()) {
      // Check for duplicate barcode
      const existingBarcode = await getProductByBarcode(productData.barcode.trim());
      if (existingBarcode) {
        throw new Error('Barcode sudah digunakan');
      }
    }

    // Transform data for Prisma schema
    const { categoryId, supplierId, unitId, unit, stockHistory, createdAt, ...restData } = productData;

    const prismaData = {
      name: restData.name.trim(),
      sku: restData.sku.trim(),
      barcode: restData.barcode?.trim() || '',
      description: restData.description?.trim() || '',
      isActive: restData.isActive !== false,
      minStock: parseInt(restData.minStock) || 0,
      stock: parseInt(restData.stock) || 0,
      purchasePrice: parseFloat(restData.purchasePrice) || 0,
      sellingPrice: parseFloat(restData.sellingPrice) || 0,
      image: restData.image || '',
      // Use nested connect for relations (Prisma format)
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(supplierId && { supplierId: parseInt(supplierId) }),
      ...(unitId && { unitId: parseInt(unitId) }),
      tags: restData.tags || []
    };

    const savedProduct = await api.post('products', prismaData);

    // Add initial stock history via stock movement if stock > 0
    if (savedProduct.stock > 0) {
      try {
        await api.post('stockMovements', {
          productId: savedProduct.id,
          type: 'in',
          quantity: savedProduct.stock,
          notes: 'Stok awal'
        });
      } catch (stockError) {
        console.log('Stock movement creation failed (non-critical):', stockError.message);
      }
    }

    return savedProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const existing = await getProductById(id);
    if (!existing) {
      throw new Error('Produk tidak ditemukan');
    }

    // Validate name if changed
    if (productData.name && productData.name !== existing.name) {
      const duplicate = await api.get(`products?name=${productData.name.trim()}`);
      if (duplicate.length > 0 && duplicate[0].id !== id) {
        throw new Error('Nama produk sudah ada');
      }
    }

    // Validate SKU if changed
    if (productData.sku && productData.sku !== existing.sku) {
      const duplicate = await api.get(`products?sku=${productData.sku.trim()}`);
      if (duplicate.length > 0 && duplicate[0].id !== id) {
        throw new Error('SKU sudah digunakan');
      }
    }

    // Validate barcode if changed
    if (productData.barcode && productData.barcode !== existing.barcode) {
      const duplicate = await api.get(`products?barcode=${productData.barcode.trim()}`);
      if (duplicate.length > 0 && duplicate[0].id !== id) {
        throw new Error('Barcode sudah digunakan');
      }
    }

    const updatedProductData = {
      ...productData,
      name: productData.name ? productData.name.trim() : existing.name,
      sku: productData.sku ? productData.sku.trim() : existing.sku,
      barcode: productData.barcode ? productData.barcode.trim() : existing.barcode,
      description: productData.description?.trim() || existing.description,
      updatedAt: new Date().toISOString()
    };

    const result = await api.put(`products/${id}`, updatedProductData);
    return result;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    // Check if product has transactions
    // TODO: Check in sales, purchases, etc.

    await api.delete(`products/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Toggle product status
export const toggleProductStatus = async (id) => {
  try {
    const product = await getProductById(id);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    await api.put(`products/${id}`, {
      isActive: !product.isActive,
      updatedAt: new Date().toISOString()
    });

    return !product.isActive;
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw error;
  }
};

// Update stock (Simple adjustment via movement)
export const updateStock = async (id, stockData) => {
  try {
    // stockData: { type, quantity, note, reference, expiryDate }
    const response = await api.post(`products/${id}/stock`, stockData);
    return response.stock;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Add stock history (Mapped to StockMovements)
export const addStockHistory = async (productId, historyData) => {
  try {
    return await api.post('stockMovements', {
      productId,
      movementType: historyData.type || 'adjustment',
      quantity: historyData.quantity,
      notes: historyData.note || '',
      previousStock: historyData.previousStock,
      newStock: historyData.newStock,
      reference: historyData.reference
    });
  } catch (error) {
    console.error('Error adding stock history:', error);
    throw error;
  }
};

// Get stock history (Mapped to StockMovements)
export const getStockHistory = async (productId) => {
  try {
    const movements = await api.get(`stockMovements?productId=${productId}`);
    // Sort by createdAt descending
    return movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting stock history:', error);
    throw error;
  }
};

// Get product statistics
export const getProductStats = async () => {
  try {
    const products = await api.get('products');

    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const activeCount = products.filter(p => p.isActive).length;

    return {
      total: products.length,
      active: activeCount,
      inactive: products.length - activeCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalValue: totalValue,
      avgPrice: products.length > 0
        ? products.reduce((sum, p) => sum + p.sellingPrice, 0) / products.length
        : 0
    };
  } catch (error) {
    console.error('Error getting product stats:', error);
    throw error;
  }
};

// Get low stock products
export const getLowStockProducts = async (limit = 10) => {
  try {
    let products = await api.get('products');
    products = products.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock); // Sort by stock ascending

    // Get all suppliers and categories for mapping
    const [allCategories, allSuppliers] = await Promise.all([
      api.get('categories'),
      api.get('suppliers')
    ]);

    // Enrich with category and supplier names
    const enrichedProducts = products.map(product => {
      const category = allCategories.find(c => c.id === product.categoryId);
      const supplier = allSuppliers.find(s => s.id === product.supplierId);

      return {
        ...product,
        categoryName: category?.name || '-',
        supplierName: supplier?.name || '-'
      };
    });

    return enrichedProducts.slice(0, limit);
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
};

// Export products
export const exportProducts = async (filters = {}) => {
  try {
    const products = await getAllProducts(filters);

    // getAllProducts already enriches with categoryName and supplierName, so no need to fetch again

    return products.map(product => {
      const stockStatus = product.stock === 0
        ? 'Habis'
        : product.stock <= product.minStock
          ? 'Hampir Habis'
          : 'Aman';

      const profit = product.sellingPrice - product.purchasePrice;
      const margin = product.purchasePrice > 0 ? ((profit / product.purchasePrice) * 100).toFixed(1) + '%' : '0%';
      const tags = product.tags ? product.tags.map(t => t.tag).join(', ') : '';

      return {
        // --- COLUMNS MATCHING IMPORTER TEMPLATE ---
        'Nama Produk': product.name,
        'SKU': product.sku || '-',
        'Barcode': product.barcode ? `"${product.barcode}"` : '-',
        'Kategori': product.categoryName,
        'Supplier': product.supplierName,
        'Satuan': product.unitName || '-',
        'Harga Beli': product.purchasePrice,
        'Harga Jual': product.sellingPrice,
        'Stok': product.stock,
        'Stok Minimum': product.minStock,
        'Tags': tags,

        // --- INFORMATIONAL COLUMNS (Appended) ---
        'Margin': margin,
        'Status Stok': stockStatus,
        'Status': product.isActive ? 'Aktif' : 'Tidak Aktif',
        'Deskripsi': product.description || '-',
        'Dibuat': new Date(product.createdAt).toLocaleDateString('id-ID')
      };
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
};

// Quick search by barcode
export const quickSearchByBarcode = async (barcode) => {
  try {
    const product = await getProductByBarcode(barcode);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    return product;
  } catch (error) {
    console.error('Error in quick search:', error);
    throw error;
  }
};

// Get all units (for dropdown)
export const getProductUnits = () => {
  return [
    { value: 'pcs', label: 'Pcs' },
    { value: 'box', label: 'Box' },
    { value: 'dus', label: 'Dus' },
    { value: 'pack', label: 'Pack' },
    { value: 'unit', label: 'Unit' },
    { value: 'kg', label: 'Kg' },
    { value: 'gram', label: 'Gram' },
    { value: 'liter', label: 'Liter' },
    { value: 'ml', label: 'Ml' },
    { value: 'meter', label: 'Meter' }
  ];
};

// Import products (Bulk Create-Smart)
export const importProducts = async (products) => {
  try {
    const response = await api.post('products/bulk', { products });
    return response;
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
};