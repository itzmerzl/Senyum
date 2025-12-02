import db from '../config/database';

// Get all payment methods
export async function getAllPaymentMethods() {
  try {
    const methods = await db.paymentMethods.toArray();
    return methods.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran');
  }
}

// Get active payment methods only
export async function getActivePaymentMethods() {
  try {
    const methods = await db.paymentMethods
      .where('isActive')
      .equals(1)
      .or('isActive')
      .equals(true)
      .toArray();
    
    return methods.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran aktif');
  }
}

// Get payment method by code
export async function getPaymentMethodByCode(code) {
  try {
    const method = await db.paymentMethods
      .where('code')
      .equals(code)
      .first();
    
    return method || null;
  } catch (error) {
    console.error('Error fetching payment method:', error);
    throw new Error('Gagal mengambil metode pembayaran');
  }
}

// Create payment method
export async function createPaymentMethod(methodData) {
  try {
    // Check duplicate code
    const existing = await getPaymentMethodByCode(methodData.code);
    if (existing) {
      throw new Error('Kode metode pembayaran sudah ada');
    }
    
    const method = {
      ...methodData,
      isActive: methodData.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await db.paymentMethods.add(method);
    return { id, ...method };
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
}

// Update payment method
export async function updatePaymentMethod(id, methodData) {
  try {
    const method = await db.paymentMethods.get(id);
    if (!method) {
      throw new Error('Metode pembayaran tidak ditemukan');
    }
    
    // Check duplicate code if changed
    if (methodData.code && methodData.code !== method.code) {
      const existing = await getPaymentMethodByCode(methodData.code);
      if (existing && existing.id !== id) {
        throw new Error('Kode metode pembayaran sudah digunakan');
      }
    }
    
    await db.paymentMethods.update(id, {
      ...methodData,
      updatedAt: new Date()
    });
    
    return await db.paymentMethods.get(id);
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
}

// Delete payment method
export async function deletePaymentMethod(id) {
  try {
    const method = await db.paymentMethods.get(id);
    if (!method) {
      throw new Error('Metode pembayaran tidak ditemukan');
    }
    
    // Check if used in transactions
    const usedInTransactions = await db.transactions
      .where('paymentMethod')
      .equals(method.code)
      .count();
    
    if (usedInTransactions > 0) {
      throw new Error(`Metode pembayaran ini digunakan di ${usedInTransactions} transaksi. Tidak dapat dihapus.`);
    }
    
    await db.paymentMethods.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}

// Toggle payment method status
export async function togglePaymentMethodStatus(id) {
  try {
    const method = await db.paymentMethods.get(id);
    if (!method) {
      throw new Error('Metode pembayaran tidak ditemukan');
    }
    
    await db.paymentMethods.update(id, {
      isActive: !method.isActive,
      updatedAt: new Date()
    });
    
    return !method.isActive;
  } catch (error) {
    console.error('Error toggling payment method status:', error);
    throw error;
  }
}

// Update display order
export async function updateDisplayOrder(id, newOrder) {
  try {
    await db.paymentMethods.update(id, {
      displayOrder: newOrder,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating display order:', error);
    throw error;
  }
}

// Get all bank accounts
export async function getAllBankAccounts() {
  try {
    const accounts = await db.bankAccounts.toArray();
    return accounts.sort((a, b) => a.bankName.localeCompare(b.bankName));
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw new Error('Gagal mengambil akun bank');
  }
}

// Get active bank accounts
export async function getActiveBankAccounts() {
  try {
    const accounts = await db.bankAccounts
      .where('isActive')
      .equals(1)
      .or('isActive')
      .equals(true)
      .toArray();
    
    return accounts.sort((a, b) => a.bankName.localeCompare(b.bankName));
  } catch (error) {
    console.error('Error fetching active bank accounts:', error);
    throw new Error('Gagal mengambil akun bank aktif');
  }
}

// Create bank account
export async function createBankAccount(accountData) {
  try {
    const account = {
      ...accountData,
      isActive: accountData.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await db.bankAccounts.add(account);
    return { id, ...account };
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw new Error('Gagal menambahkan akun bank');
  }
}

// Update bank account
export async function updateBankAccount(id, accountData) {
  try {
    const account = await db.bankAccounts.get(id);
    if (!account) {
      throw new Error('Akun bank tidak ditemukan');
    }
    
    await db.bankAccounts.update(id, {
      ...accountData,
      updatedAt: new Date()
    });
    
    return await db.bankAccounts.get(id);
  } catch (error) {
    console.error('Error updating bank account:', error);
    throw error;
  }
}

// Delete bank account
export async function deleteBankAccount(id) {
  try {
    await db.bankAccounts.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw new Error('Gagal menghapus akun bank');
  }
}

export default {
  getAllPaymentMethods,
  getActivePaymentMethods,
  getPaymentMethodByCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus,
  updateDisplayOrder,
  getAllBankAccounts,
  getActiveBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount
};