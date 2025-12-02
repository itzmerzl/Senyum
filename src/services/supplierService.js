import db from '../config/database';

// Generate supplier code with format: SUP/001
export const generateSupplierCode = async () => {
  try {
    const suppliers = await db.suppliers.toArray();
    
    // Filter suppliers yang punya code dengan pattern SUP/XXX
    const validCodes = suppliers.filter(sup => 
      sup.code && sup.code.startsWith('SUP/')
    );
    
    // Ambil semua nomor urut
    const sequences = validCodes.map(sup => {
      const parts = sup.code.split('/');
      return parseInt(parts[1]) || 0;
    });
    
    // Cari nomor tertinggi
    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    
    return `SUP/${nextSequence}`;
  } catch (error) {
    console.error('Error generating supplier code:', error);
    throw error;
  }
};

// Get all suppliers
export const getAllSuppliers = async (filters = {}) => {
  try {
    let query = db.suppliers;
    
    // Filter by status
    if (filters.status === 'active') {
      query = query.where('isActive').equals(true);
    } else if (filters.status === 'inactive') {
      query = query.where('isActive').equals(false);
    }
    
    const suppliers = await query.toArray();
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return suppliers.filter(sup => 
        sup.name.toLowerCase().includes(searchLower) ||
        sup.code.toLowerCase().includes(searchLower) ||
        (sup.contactPerson && sup.contactPerson.toLowerCase().includes(searchLower)) ||
        (sup.email && sup.email.toLowerCase().includes(searchLower))
      );
    }
    
    return suppliers;
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
};

// Get supplier by ID
export const getSupplierById = async (id) => {
  try {
    return await db.suppliers.get(id);
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
};

// Get supplier by code
export const getSupplierByCode = async (code) => {
  try {
    return await db.suppliers
      .where('code')
      .equals(code)
      .first();
  } catch (error) {
    console.error('Error getting supplier by code:', error);
    throw error;
  }
};

// Create new supplier
export const createSupplier = async (supplierData) => {
  try {
    // Generate supplier code
    const code = await generateSupplierCode();
    
    // Check if code already exists (safety check)
    const existing = await getSupplierByCode(code);
    if (existing) {
      const newCode = await generateSupplierCode();
      supplierData.code = newCode;
    } else {
      supplierData.code = code;
    }
    
    const newSupplier = {
      ...supplierData,
      isActive: supplierData.isActive !== undefined ? supplierData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const id = await db.suppliers.add(newSupplier);
    return { id, ...newSupplier };
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

// Update supplier
export const updateSupplier = async (id, supplierData) => {
  try {
    const updated = {
      ...supplierData,
      updatedAt: new Date(),
    };
    
    await db.suppliers.update(id, updated);
    return await getSupplierById(id);
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

// Delete supplier
export const deleteSupplier = async (id) => {
  try {
    // Check if supplier has products
    const products = await db.products
      .where('supplierId')
      .equals(id)
      .count();
    
    if (products > 0) {
      throw new Error('Tidak dapat menghapus supplier yang memiliki produk terkait');
    }
    
    await db.suppliers.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

// Get supplier statistics
export const getSupplierStats = async () => {
  try {
    const allSuppliers = await db.suppliers.toArray();
    
    return {
      total: allSuppliers.length,
      active: allSuppliers.filter(s => s.isActive).length,
      inactive: allSuppliers.filter(s => !s.isActive).length,
    };
  } catch (error) {
    console.error('Error getting supplier stats:', error);
    throw error;
  }
};

// Export suppliers to array
export const exportSuppliers = async (filters = {}) => {
  try {
    const suppliers = await getAllSuppliers(filters);
    
    return suppliers.map(supplier => ({
      'Kode': supplier.code,
      'Nama Supplier': supplier.name,
      'Alamat': supplier.address || '-',
      'No. Telepon': supplier.phone || '-',
      'Email': supplier.email || '-',
      'Contact Person': supplier.contactPerson || '-',
      'NPWP': supplier.taxNumber || '-',
      'Status': supplier.isActive ? 'Aktif' : 'Tidak Aktif',
      'Tanggal Dibuat': new Date(supplier.createdAt).toLocaleDateString('id-ID'),
    }));
  } catch (error) {
    console.error('Error exporting suppliers:', error);
    throw error;
  }
};

// Bulk import suppliers
export const bulkImportSuppliers = async (suppliersData) => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const supplierData of suppliersData) {
      try {
        await createSupplier(supplierData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          data: supplierData,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error bulk importing suppliers:', error);
    throw error;
  }
};