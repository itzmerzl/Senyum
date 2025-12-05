import { db, getSupplierDefaults } from '../config/database';
import { logActivity } from './activityLogService';

/**
 * Generate unique supplier code
 * Format: SUP/XXX (e.g., SUP/001, SUP/002, ...)
 */
export const generateSupplierCode = async () => {
  try {
    const suppliers = await db.suppliers.orderBy('code').reverse().toArray();
    
    if (suppliers.length === 0) {
      return 'SUP/001';
    }
    
    const lastCode = suppliers[0].code;
    const numPart = parseInt(lastCode.split('/')[1]);
    const newNum = numPart + 1;
    
    return `SUP/${String(newNum).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating supplier code:', error);
    throw new Error('Gagal generate kode supplier');
  }
};

/**
 * Get all suppliers with optional filters
 */
export const getAllSuppliers = async (filters = {}) => {
  try {
    let query = db.suppliers.toCollection();
    
    if (filters.isActive !== undefined) {
      query = query.filter(s => s.isActive === filters.isActive);
    }
    
    const suppliers = await query.toArray();
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw new Error('Gagal memuat data supplier');
  }
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id) => {
  try {
    const supplier = await db.suppliers.get(id);
    if (!supplier) {
      throw new Error('Supplier tidak ditemukan');
    }
    return supplier;
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
};

/**
 * Create new supplier
 */
export const createSupplier = async (supplierData) => {
  try {
    // Validate required fields
    if (!supplierData.name || !supplierData.name.trim()) {
      throw new Error('Nama supplier wajib diisi');
    }
    
    // Check duplicate name
    const existing = await db.suppliers
      .where('name')
      .equalsIgnoreCase(supplierData.name.trim())
      .first();
    
    if (existing) {
      throw new Error('Nama supplier sudah digunakan');
    }
    
    // Generate code
    const code = await generateSupplierCode();
    
    // Validate email if provided
    if (supplierData.email && supplierData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supplierData.email)) {
        throw new Error('Format email tidak valid');
      }
    }
    
    // Validate phone if provided
    if (supplierData.phone && supplierData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
      if (!phoneRegex.test(supplierData.phone)) {
        throw new Error('Format nomor telepon tidak valid');
      }
    }
    
    // Validate bank account if provided
    if (supplierData.bankAccount && supplierData.bankAccount.trim()) {
      const accountRegex = /^[0-9]{5,20}$/;
      if (!accountRegex.test(supplierData.bankAccount)) {
        throw new Error('Nomor rekening harus 5-20 digit angka');
      }
    }
    
    // Prepare supplier object with defaults
    const newSupplier = getSupplierDefaults({
      ...supplierData,
      code,
      name: supplierData.name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Add to database
    const id = await db.suppliers.add(newSupplier);
    
    // Log activity
    await logActivity({
      action: 'CREATE',
      module: 'SUPPLIER',
      description: `Menambahkan supplier: ${newSupplier.name}`,
      metadata: { supplierId: id, supplierCode: code }
    });
    
    return id;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (id, updates) => {
  try {
    const existing = await db.suppliers.get(id);
    
    if (!existing) {
      throw new Error('Supplier tidak ditemukan');
    }
    
    // Validate name if changed
    if (updates.name && updates.name.trim() !== existing.name) {
      const duplicate = await db.suppliers
        .where('name')
        .equalsIgnoreCase(updates.name.trim())
        .and(s => s.id !== id)
        .first();
      
      if (duplicate) {
        throw new Error('Nama supplier sudah digunakan');
      }
    }
    
    // Validate email if provided
    if (updates.email && updates.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Format email tidak valid');
      }
    }
    
    // Validate phone if provided
    if (updates.phone && updates.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
      if (!phoneRegex.test(updates.phone)) {
        throw new Error('Format nomor telepon tidak valid');
      }
    }
    
    // Validate bank account if provided
    if (updates.bankAccount && updates.bankAccount.trim()) {
      const accountRegex = /^[0-9]{5,20}$/;
      if (!accountRegex.test(updates.bankAccount)) {
        throw new Error('Nomor rekening harus 5-20 digit angka');
      }
    }
    
    // Prepare update object
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // Update database
    const count = await db.suppliers.update(id, updateData);
    
    // Log activity
    await logActivity({
      action: 'UPDATE',
      module: 'SUPPLIER',
      description: `Mengupdate supplier: ${updates.name || existing.name}`,
      metadata: { supplierId: id }
    });
    
    return count;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (id) => {
  try {
    const supplier = await db.suppliers.get(id);
    
    if (!supplier) {
      throw new Error('Supplier tidak ditemukan');
    }
    
    // Check if supplier has related products
    const products = await db.products
      .where('supplierId')
      .equals(id)
      .toArray();
    
    if (products.length > 0) {
      throw new Error(
        `Tidak dapat menghapus supplier karena masih memiliki ${products.length} produk terkait`
      );
    }
    
    await db.suppliers.delete(id);
    
    // Log activity
    await logActivity({
      action: 'DELETE',
      module: 'SUPPLIER',
      description: `Menghapus supplier: ${supplier.name}`,
      metadata: { supplierId: id, supplierCode: supplier.code }
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

/**
 * Get supplier statistics
 */
export const getSupplierStats = async () => {
  try {
    const suppliers = await db.suppliers.toArray();
    
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.isActive).length,
      inactive: suppliers.filter(s => !s.isActive).length,
      withEmail: suppliers.filter(s => s.email && s.email.trim()).length,
      withPhone: suppliers.filter(s => s.phone && s.phone.trim()).length
    };
  } catch (error) {
    console.error('Error getting supplier stats:', error);
    throw error;
  }
};

/**
 * Search suppliers
 */
export const searchSuppliers = async (query) => {
  try {
    if (!query || !query.trim()) {
      return await getAllSuppliers();
    }
    
    const searchTerm = query.toLowerCase().trim();
    const suppliers = await db.suppliers.toArray();
    
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.code.toLowerCase().includes(searchTerm) ||
      (s.email && s.email.toLowerCase().includes(searchTerm)) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.address && s.address.toLowerCase().includes(searchTerm))
    );
  } catch (error) {
    console.error('Error searching suppliers:', error);
    throw error;
  }
};

/**
 * Get active suppliers only
 */
export const getActiveSuppliers = async () => {
  try {
    return await db.suppliers
      .where('isActive')
      .equals(1)
      .toArray();
  } catch (error) {
    console.error('Error getting active suppliers:', error);
    throw error;
  }
};

/**
 * Update supplier order statistics
 */
export const updateSupplierOrderStats = async (id, orderAmount) => {
  try {
    const supplier = await db.suppliers.get(id);
    
    if (!supplier) {
      throw new Error('Supplier tidak ditemukan');
    }
    
    await db.suppliers.update(id, {
      totalOrders: (supplier.totalOrders || 0) + 1,
      totalAmount: (supplier.totalAmount || 0) + orderAmount,
      lastOrderDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating supplier order stats:', error);
    throw error;
  }
};

/**
 * Export suppliers to Excel format
 */
export const exportSuppliers = async (filters = {}) => {
  try {
    const suppliers = await getAllSuppliers(filters);
    
    return suppliers.map(s => ({
      'Kode': s.code,
      'Nama Supplier': s.name,
      'Telepon': s.phone || '-',
      'Email': s.email || '-',
      'Alamat': s.address || '-',
      'Bank': s.bankName || '-',
      'No. Rekening': s.bankAccount || '-',
      'Nama Pemilik Rekening': s.bankAccountName || '-',
      'Total Order': s.totalOrders || 0,
      'Total Nilai': s.totalAmount || 0,
      'Tanggal Order Terakhir': s.lastOrderDate ? new Date(s.lastOrderDate).toLocaleDateString('id-ID') : '-',
      'Catatan': s.notes || '-',
      'Status': s.isActive ? 'Aktif' : 'Tidak Aktif',
      'Tanggal Dibuat': new Date(s.createdAt).toLocaleDateString('id-ID')
    }));
  } catch (error) {
    console.error('Error exporting suppliers:', error);
    throw error;
  }
};