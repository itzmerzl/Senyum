import api from '../utils/apiClient';

// Generate unique category code
export const generateCategoryCode = async () => {
  try {
    const categories = await api.get('categories');

    const validCodes = categories.filter(cat =>
      cat.code && cat.code.startsWith('CAT/')
    );

    const sequences = validCodes.map(cat => {
      const parts = cat.code.split('/');
      return parseInt(parts[1]) || 0;
    });

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
    const categories = await api.get('categories');
    return categories; // Already sorted by backend (ID desc)
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Get active categories only
export const getActiveCategories = async () => {
  try {
    const categories = await api.get('categories?isActive=true');
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting active categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (id) => {
  try {
    return await api.get(`categories/${id}`);
  } catch (error) {
    console.error('Error getting category:', error);
    throw error;
  }
};

// Get category by code
export const getCategoryByCode = async (code) => {
  try {
    const categories = await api.get(`categories?code=${code}`);
    return categories[0] || null;
  } catch (error) {
    console.error('Error getting category by code:', error);
    throw error;
  }
};

// Create new category
export const createCategory = async (categoryData) => {
  try {
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Nama kategori wajib diisi');
    }

    // Check for duplicate name
    const existing = await api.get(`categories?name=${categoryData.name.trim()}`);
    if (existing.length > 0) {
      throw new Error('Nama kategori sudah ada');
    }

    if (!categoryData.code) {
      categoryData.code = await generateCategoryCode();
    }

    const newCategory = {
      ...categoryData,
      name: categoryData.name.trim(),
      isActive: categoryData.isActive !== false,
      createdAt: new Date().toISOString()
    };

    return await api.post('categories', newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update category
export const updateCategory = async (id, categoryData) => {
  try {
    return await api.put(`categories/${id}`, categoryData);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id) => {
  try {
    // Check if category is used in products
    const products = await api.get(`products?categoryId=${id}`);
    if (products.length > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${products.length} produk`);
    }

    await api.delete(`categories/${id}`);
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
    if (!category) throw new Error('Kategori tidak ditemukan');

    await api.put(`categories/${id}`, { isActive: !category.isActive });
    return !category.isActive;
  } catch (error) {
    console.error('Error toggling category status:', error);
    throw error;
  }
};

// Get category statistics
export const getCategoryStats = async () => {
  try {
    const categories = await api.get('categories');

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