import db from '../config/database';

// Generate unique SKU
export const generateSKU = async () => {
  try {
    const products = await db.products.toArray();
    
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
    let isUnique = false;
    
    while (!isUnique) {
      const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      barcode = `899${random}`;
      
      // Check if barcode exists
      const existing = await db.products.where('barcode').equals(barcode).first();
      if (!existing) {
        isUnique = true;
      }
    }
    
    return barcode;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
};

// Get all products with filters
export const getAllProducts = async (filters = {}) => {
  try {
    let collection = db.products;
    
    // Apply filters
    if (filters.categoryId) {
      collection = collection.where('categoryId').equals(parseInt(filters.categoryId));
    }
    
    if (filters.supplierId) {
      collection = collection.where('supplierId').equals(parseInt(filters.supplierId));
    }
    
    if (filters.status) {
      const isActive = filters.status === 'active';
      collection = collection.where('isActive').equals(isActive);
    }
    
    if (filters.stockStatus) {
      if (filters.stockStatus === 'low') {
        collection = collection.filter(p => p.stock <= p.minStock);
      } else if (filters.stockStatus === 'out') {
        collection = collection.filter(p => p.stock === 0);
      } else if (filters.stockStatus === 'safe') {
        collection = collection.filter(p => p.stock > p.minStock);
      }
    }
    
    const products = await collection.toArray();
    
    // Get ALL categories AND suppliers
    const [allCategories, allSuppliers] = await Promise.all([
      db.categories.toArray(),
      db.suppliers.toArray()
    ]);
    
    // Enrich products dengan category name dan supplier name
    const enrichedProducts = products.map(product => {
      // Convert IDs to number for comparison
      const productCategoryId = Number(product.categoryId);
      const productSupplierId = Number(product.supplierId);
      
      const category = allCategories.find(c => Number(c.id) === productCategoryId);
      const supplier = allSuppliers.find(s => Number(s.id) === productSupplierId);
      
      return {
        ...product,
        categoryName: category?.name || '-',
        category: category?.name || '-',
        supplierName: supplier?.name || '-',
        supplier: supplier?.name || '-'
      };
    });
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const filtered = enrichedProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm) ||
        (p.barcode && p.barcode.includes(searchTerm))
      );
      return filtered;
    }
    
    // Default sort by newest
    const sorted = enrichedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
    
  } catch (error) {
    console.error('❌ Error getting products:', error);
    throw error;
  }
};

// Get product by ID with related data
export const getProductById = async (id) => {
  try {
    const product = await db.products.get(id);
    if (!product) return null;
    
    // Get category name
    if (product.categoryId) {
      const category = await db.categories.get(product.categoryId);
      product.categoryName = category?.name || '';
      product.category = category?.name || ''; // tambahkan untuk konsistensi
    }
    
    // Get supplier name
    if (product.supplierId) {
      const supplier = await db.suppliers.get(product.supplierId);
      product.supplierName = supplier?.name || '';
      product.supplier = supplier?.name || ''; // tambahkan untuk konsistensi
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
    return await db.products.where('barcode').equals(barcode).first();
  } catch (error) {
    console.error('Error getting product by barcode:', error);
    throw error;
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
    const existingName = await db.products
      .where('name')
      .equalsIgnoreCase(productData.name.trim())
      .first();
    
    if (existingName) {
      throw new Error('Nama produk sudah ada');
    }

    // Generate SKU if not provided
    if (!productData.sku) {
      productData.sku = await generateSKU();
    } else {
      // Check for duplicate SKU
      const existingSKU = await db.products
        .where('sku')
        .equals(productData.sku.trim())
        .first();
      
      if (existingSKU) {
        throw new Error('SKU sudah digunakan');
      }
    }

    // Generate barcode if not provided
    if (!productData.barcode) {
      productData.barcode = await generateBarcodeNumber();
    } else if (productData.barcode.trim()) {
      // Check for duplicate barcode
      const existingBarcode = await getProductByBarcode(productData.barcode.trim());
      if (existingBarcode) {
        throw new Error('Barcode sudah digunakan');
      }
    }

    const product = {
      ...productData,
      name: productData.name.trim(),
      sku: productData.sku.trim(),
      barcode: productData.barcode?.trim() || '',
      description: productData.description?.trim() || '',
      unit: productData.unit || 'pcs',
      isActive: productData.isActive !== false,
      minStock: productData.minStock || 0,
      stock: productData.stock || 0,
      stockHistory: [],
      createdAt: new Date().toISOString()
    };

    const id = await db.products.add(product);
    
    // Add initial stock history
    if (product.stock > 0) {
      await addStockHistory(id, {
        type: 'initial',
        quantity: product.stock,
        note: 'Stok awal',
        createdAt: new Date().toISOString()
      });
    }
    
    return { id, ...product };
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
      const duplicate = await db.products
        .where('name')
        .equalsIgnoreCase(productData.name.trim())
        .first();
      
      if (duplicate && duplicate.id !== id) {
        throw new Error('Nama produk sudah ada');
      }
    }

    // Validate SKU if changed
    if (productData.sku && productData.sku !== existing.sku) {
      const duplicate = await db.products
        .where('sku')
        .equals(productData.sku.trim())
        .first();
      
      if (duplicate && duplicate.id !== id) {
        throw new Error('SKU sudah digunakan');
      }
    }

    // Validate barcode if changed
    if (productData.barcode && productData.barcode !== existing.barcode) {
      const duplicate = await db.products
        .where('barcode')
        .equals(productData.barcode.trim())
        .first();
      
      if (duplicate && duplicate.id !== id) {
        throw new Error('Barcode sudah digunakan');
      }
    }

    const updatedProduct = {
      ...productData,
      name: productData.name ? productData.name.trim() : existing.name,
      sku: productData.sku ? productData.sku.trim() : existing.sku,
      barcode: productData.barcode ? productData.barcode.trim() : existing.barcode,
      description: productData.description?.trim() || existing.description,
      updatedAt: new Date().toISOString()
    };

    await db.products.update(id, updatedProduct);
    return { id, ...existing, ...updatedProduct };
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
    
    await db.products.delete(id);
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

    await db.products.update(id, {
      isActive: !product.isActive,
      updatedAt: new Date().toISOString()
    });

    return !product.isActive;
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw error;
  }
};

// Update stock
export const updateStock = async (id, stockData) => {
  try {
    const product = await getProductById(id);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    if (stockData.quantity === undefined || stockData.quantity === null) {
      throw new Error('Jumlah stok wajib diisi');
    }

    const newStock = product.stock + stockData.quantity;
    
    if (newStock < 0) {
      throw new Error('Stok tidak boleh kurang dari 0');
    }

    await db.products.update(id, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    });

    // Add stock history
    await addStockHistory(id, {
      type: stockData.type || 'adjustment',
      quantity: stockData.quantity,
      note: stockData.note || '',
      previousStock: product.stock,
      newStock: newStock,
      reference: stockData.reference,
      createdAt: new Date().toISOString()
    });

    return newStock;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Add stock history
export const addStockHistory = async (productId, historyData) => {
  try {
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    const history = {
      id: Date.now(),
      productId,
      ...historyData
    };

    const updatedHistory = [...(product.stockHistory || []), history];
    
    await db.products.update(productId, {
      stockHistory: updatedHistory
    });

    return history;
  } catch (error) {
    console.error('Error adding stock history:', error);
    throw error;
  }
};

// Get stock history
export const getStockHistory = async (productId) => {
  try {
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    return product.stockHistory?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || [];
  } catch (error) {
    console.error('Error getting stock history:', error);
    throw error;
  }
};

// Get product statistics
export const getProductStats = async () => {
  try {
    const products = await db.products.toArray();
    
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
// Get low stock products
export const getLowStockProducts = async (limit = 10) => {
  try {
    const products = await db.products
      .filter(p => p.stock <= p.minStock)
      .sortBy('stock');
    
    // Get all suppliers untuk mapping
    const allSuppliers = await db.suppliers.toArray();
    const allCategories = await db.categories.toArray();
    
    // Enrich dengan category dan supplier names
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
    
    // Get categories and suppliers for mapping
    const categories = await db.categories.toArray();
    const suppliers = await db.suppliers.toArray();
    
    return products.map(product => {
      const category = categories.find(c => c.id === product.categoryId);
      const supplier = suppliers.find(s => s.id === product.supplierId);
      
      const stockStatus = product.stock === 0 
        ? 'Habis' 
        : product.stock <= product.minStock 
          ? 'Hampir Habis' 
          : 'Aman';
      
      return {
        'SKU': product.sku,
        'Barcode': product.barcode || '-',
        'Nama Produk': product.name,
        'Kategori': category?.name || '-',
        'Supplier': supplier?.name || '-',
        'Satuan': product.unit,
        'Harga Beli': product.purchasePrice,
        'Harga Jual': product.sellingPrice,
        'Stok': product.stock,
        'Stok Minimum': product.minStock,
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