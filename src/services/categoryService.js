import db from '../config/database';

// Generate unique category code
export const generateCategoryCode = async () => {
  try {
    // Get all categories
    const categories = await db.categories.toArray();
    
    // Filter categories yang punya code dengan pattern CAT/XXX
    const validCodes = categories.filter(cat => 
      cat.code && cat.code.startsWith('CAT/')
    );
    
    // Ambil semua nomor urut
    const sequences = validCodes.map(cat => {
      const parts = cat.code.split('/');
      return parseInt(parts[1]) || 0;
    });
    
    // Cari nomor tertinggi
    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    
    return `CAT/${nextSequence}`;
  } catch (error) {
    console.error('Error generating category code:', error);
    throw error;
  }
};

// Get all categories
export const getAllCategories = async () => {
  try {
    const categories = await db.categories.toArray();
    return categories.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Get active categories only
export const getActiveCategories = async () => {
  try {
    const categories = await db.categories.where('isActive').equals(true).toArray();
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting active categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (id) => {
  try {
    return await db.categories.get(id);
  } catch (error) {
    console.error('Error getting category:', error);
    throw error;
  }
};

// Get category by code
export const getCategoryByCode = async (code) => {
  try {
    return await db.categories.where('code').equals(code).first();
  } catch (error) {
    console.error('Error getting category by code:', error);
    throw error;
  }
};

// Create new category
export const createCategory = async (categoryData) => {
  try {
    // Validate required fields
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Nama kategori wajib diisi');
    }

    // Check for duplicate name
    const existingName = await db.categories
      .where('name')
      .equalsIgnoreCase(categoryData.name.trim())
      .first();
    
    if (existingName) {
      throw new Error('Nama kategori sudah ada');
    }

    // Generate code if not provided
    if (!categoryData.code) {
      categoryData.code = await generateCategoryCode();
    }

    // Check for duplicate code
    const existingCode = await getCategoryByCode(categoryData.code);
    if (existingCode) {
      throw new Error('Kode kategori sudah ada');
    }

    const category = {
      ...categoryData,
      name: categoryData.name.trim(),
      isActive: categoryData.isActive !== false,
      createdAt: new Date().toISOString()
    };

    const id = await db.categories.add(category);
    return { id, ...category };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update category
export const updateCategory = async (id, categoryData) => {
  try {
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new Error('Kategori tidak ditemukan');
    }

    // Validate name if changed
    if (categoryData.name && categoryData.name !== existing.name) {
      const duplicate = await db.categories
        .where('name')
        .equalsIgnoreCase(categoryData.name.trim())
        .first();
      
      if (duplicate && duplicate.id !== id) {
        throw new Error('Nama kategori sudah ada');
      }
    }

    const updatedCategory = {
      ...categoryData,
      name: categoryData.name ? categoryData.name.trim() : existing.name,
      updatedAt: new Date().toISOString()
    };

    await db.categories.update(id, updatedCategory);
    return { id, ...existing, ...updatedCategory };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id) => {
  try {
    // Check if category is used in products
    // TODO: Uncomment when products table is ready
    // const productsCount = await db.products.where('categoryId').equals(id).count();
    // if (productsCount > 0) {
    //   throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${productsCount} produk`);
    // }

    await db.categories.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Toggle category status
export const toggleCategoryStatus = async (id) => {
  try {
    const category = await getCategoryById(id);
    if (!category) {
      throw new Error('Kategori tidak ditemukan');
    }

    await db.categories.update(id, {
      isActive: !category.isActive,
      updatedAt: new Date().toISOString()
    });

    return !category.isActive;
  } catch (error) {
    console.error('Error toggling category status:', error);
    throw error;
  }
};

// Get category statistics
export const getCategoryStats = async () => {
  try {
    const categories = await db.categories.toArray();
    
    return {
      total: categories.length,
      active: categories.filter(c => c.isActive).length,
      inactive: categories.filter(c => !c.isActive).length
    };
  } catch (error) {
    console.error('Error getting category stats:', error);
    throw error;
  }
};

// Export categories
export const exportCategories = async () => {
  try {
    const categories = await getAllCategories();
    
    return categories.map(cat => ({
      'Kode': cat.code,
      'Nama Kategori': cat.name,
      'Deskripsi': cat.description || '-',
      'Icon': cat.icon || '-',
      'Warna': cat.color || '-',
      'Status': cat.isActive ? 'Aktif' : 'Tidak Aktif',
      'Dibuat': new Date(cat.createdAt).toLocaleDateString('id-ID')
    }));
  } catch (error) {
    console.error('Error exporting categories:', error);
    throw error;
  }
};