import api from '../utils/apiClient';
import { logActivity } from './activityLogService';

/**
 * Generate unique supplier code
 */
export const generateSupplierCode = async () => {
  try {
    const suppliers = await api.get('suppliers');

    if (suppliers.length === 0) {
      return 'SUP/001';
    }

    // Get max code
    const codes = suppliers.map(s => {
      const parts = s.code.split('/');
      return parseInt(parts[1]) || 0;
    });

    const maxNum = Math.max(...codes, 0);
    const newNum = maxNum + 1;

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
    const queryParams = new URLSearchParams();
    if (filters.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive ? 'true' : 'false');
    }

    const queryString = queryParams.toString();
    const endpoint = `suppliers${queryString ? `?${queryString}` : ''}`;

    const suppliers = await api.get(endpoint);
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
    return await api.get(`suppliers/${id}`);
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
    if (!supplierData.name || !supplierData.name.trim()) {
      throw new Error('Nama supplier wajib diisi');
    }

    // Check duplicate name
    const existing = await api.get(`suppliers?name=${supplierData.name.trim()}`);
    if (existing.length > 0) {
      throw new Error('Nama supplier sudah digunakan');
    }

    const code = supplierData.code || await generateSupplierCode();

    const newSupplier = {
      ...supplierData,
      code,
      name: supplierData.name.trim(),
      isActive: supplierData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedSupplier = await api.post('suppliers', newSupplier);

    // Log activity
    await logActivity({
      action: 'CREATE',
      module: 'SUPPLIER',
      description: `Menambahkan supplier: ${newSupplier.name}`,
      metadata: JSON.stringify({ supplierId: savedSupplier.id, supplierCode: code })
    });

    return savedSupplier.id;
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
    const updated = await api.put(`suppliers/${id}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    // Log activity
    await logActivity({
      action: 'UPDATE',
      module: 'SUPPLIER',
      description: `Mengupdate supplier: ${updates.name || 'ID: ' + id}`,
      metadata: JSON.stringify({ supplierId: id })
    });

    return updated;
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
    const supplier = await getSupplierById(id);

    // Check if supplier has related products
    const products = await api.get(`products?supplierId=${id}`);

    if (products.length > 0) {
      throw new Error(
        `Tidak dapat menghapus supplier karena masih memiliki ${products.length} produk terkait`
      );
    }

    await api.delete(`suppliers/${id}`);

    // Log activity
    await logActivity({
      action: 'DELETE',
      module: 'SUPPLIER',
      description: `Menghapus supplier: ${supplier.name}`,
      metadata: JSON.stringify({ supplierId: id, supplierCode: supplier.code })
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
    const suppliers = await api.get('suppliers');

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
    const suppliers = await api.get('suppliers');

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
    return await api.get('suppliers?isActive=true');
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
    const supplier = await getSupplierById(id);

    await api.put(`suppliers/${id}`, {
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