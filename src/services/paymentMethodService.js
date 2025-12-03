import db from '../config/database';

// Get all payment methods
export async function getAllPaymentMethods() {
  try {
    const methods = await db.paymentMethods.toArray();
    return methods.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran');
  }
}

// Get active payment methods only
export async function getActivePaymentMethods() {
  try {
    const allMethods = await db.paymentMethods.toArray();
    const activeMethods = allMethods.filter(method => method.isActive === true);
    return activeMethods.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran aktif');
  }
}

/**
 * Get payment method by code
 * ✅ FIXED: Use Dexie instead of IndexedDB native
 */
export async function getPaymentMethodByCode(code) {
  try {
    // Get all methods and find by code (since code is not indexed)
    const allMethods = await db.paymentMethods.toArray();
    const method = allMethods.find(m => m.code === code);
    
    if (!method) {
      return null; // Return null instead of throwing, let caller handle
    }
    
    return method;
  } catch (error) {
    console.error('Error getting payment method by code:', error);
    throw error;
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
    
    // Validate Midtrans requirement
    if (methodData.requiresMidtrans) {
      const midtransEnabled = await db.settings
        .where('key')
        .equals('midtrans_enabled')
        .first();
      
      if (!midtransEnabled || !midtransEnabled.value) {
        throw new Error('Midtrans belum dikonfigurasi. Aktifkan Midtrans di Settings terlebih dahulu.');
      }
    }
    
    const method = {
      ...methodData,
      balance: 0, // Initialize balance
      isActive: methodData.isActive !== false,
      displayOrder: methodData.displayOrder || 999,
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
    
    // Validate Midtrans requirement
    if (methodData.isActive && (methodData.requiresMidtrans || method.requiresMidtrans)) {
      const midtransEnabled = await db.settings
        .where('key')
        .equals('midtrans_enabled')
        .first();
      
      if (!midtransEnabled || !midtransEnabled.value) {
        throw new Error('Midtrans belum dikonfigurasi. Tidak dapat mengaktifkan metode ini.');
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
      throw new Error(`Metode pembayaran ini digunakan di ${usedInTransactions} transaksi. Tidak dapat dihapus. Nonaktifkan saja jika tidak ingin digunakan lagi.`);
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
    
    const newStatus = !method.isActive;
    
    // Validate Midtrans if activating
    if (newStatus && method.requiresMidtrans) {
      const midtransEnabled = await db.settings
        .where('key')
        .equals('midtrans_enabled')
        .first();
      
      if (!midtransEnabled || !midtransEnabled.value) {
        throw new Error('Midtrans belum dikonfigurasi. Tidak dapat mengaktifkan metode ini.');
      }
    }
    
    await db.paymentMethods.update(id, {
      isActive: newStatus,
      updatedAt: new Date()
    });
    
    return newStatus;
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

/**
 * ✅ FIXED: Update payment method balance using Dexie
 * @param {string} code - Payment method code
 * @param {number} amount - Amount to add/subtract
 * @param {string} type - 'add' or 'subtract'
 */
export async function updatePaymentMethodBalance(code, amount, type = 'add') {
  try {
    // Get payment method by code
    const method = await getPaymentMethodByCode(code);
    if (!method) {
      throw new Error(`Metode pembayaran "${code}" tidak ditemukan`);
    }
    
    const currentBalance = method.balance || 0;
    const newBalance = type === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    // Don't allow negative balance
    if (newBalance < 0) {
      console.warn(`Warning: Balance for ${method.name} would be negative: ${newBalance}`);
      // Uncomment if you want to prevent negative balance:
      // throw new Error('Saldo tidak boleh negatif');
    }
    
    // Update balance
    await db.paymentMethods.update(method.id, {
      balance: newBalance,
      updatedAt: new Date()
    });
    
    // Log activity
    await db.activityLogs.add({
      userId: 1, // TODO: Get from auth context
      action: type === 'add' ? 'balance_increase' : 'balance_decrease',
      module: 'payment_method',
      details: {
        paymentMethodCode: code,
        paymentMethodName: method.name,
        amount: amount,
        oldBalance: currentBalance,
        newBalance: newBalance,
        type: type
      },
      createdAt: new Date()
    });
    
    return newBalance;
  } catch (error) {
    console.error('Error updating payment method balance:', error);
    throw error;
  }
}

/**
 * ✅ FIXED: Update payment method balance by ID (for Transaction)
 * @param {number} id - Payment method ID
 * @param {object} data - Balance update data
 */
export async function updatePaymentMethodBalanceById(id, data) {
  try {
    const method = await db.paymentMethods.get(id);
    if (!method) {
      throw new Error('Metode pembayaran tidak ditemukan');
    }
    
    let newBalance = method.balance || 0;
    
    // Calculate new balance based on adjustment type
    switch (data.adjustmentType) {
      case 'payment_confirmed':
      case 'add':
        newBalance += data.amount;
        break;
      case 'refund':
      case 'subtract':
        newBalance -= data.amount;
        break;
      case 'correction':
        newBalance = data.balance;
        break;
      default:
        throw new Error('Invalid adjustment type');
    }
    
    // Update balance
    await db.paymentMethods.update(id, {
      balance: newBalance,
      updatedAt: new Date()
    });
    
    // Log activity
    await db.activityLogs.add({
      userId: 1, // TODO: Get from auth
      action: data.adjustmentType,
      module: 'payment_method',
      details: {
        paymentMethodId: id,
        paymentMethodName: method.name,
        amount: data.amount,
        oldBalance: method.balance || 0,
        newBalance: newBalance,
        notes: data.notes || ''
      },
      createdAt: new Date()
    });
    
    return await db.paymentMethods.get(id);
  } catch (error) {
    console.error('Error updating payment method balance by ID:', error);
    throw error;
  }
}

// Get payment method balance
export async function getPaymentMethodBalance(code) {
  try {
    const method = await getPaymentMethodByCode(code);
    return method?.balance || 0;
  } catch (error) {
    console.error('Error getting payment method balance:', error);
    return 0;
  }
}

// Get total balance across all payment methods
export async function getTotalBalance() {
  try {
    const methods = await db.paymentMethods.toArray();
    return methods.reduce((sum, method) => sum + (method.balance || 0), 0);
  } catch (error) {
    console.error('Error getting total balance:', error);
    return 0;
  }
}

/**
 * Manual balance adjustment (untuk kasir ambil uang, setor bank, dll)
 * ✅ FIXED: Use Dexie
 */
export async function adjustPaymentMethodBalance(code, amount, reason, userId) {
  try {
    const method = await getPaymentMethodByCode(code);
    if (!method) {
      throw new Error('Metode pembayaran tidak ditemukan');
    }
    
    const currentBalance = method.balance || 0;
    const newBalance = currentBalance + amount; // Can be positive or negative
    
    if (newBalance < 0) {
      throw new Error('Saldo tidak boleh negatif');
    }
    
    await db.paymentMethods.update(method.id, {
      balance: newBalance,
      updatedAt: new Date()
    });
    
    // Log adjustment
    await db.activityLogs.add({
      userId: userId || 1,
      action: 'balance_adjustment',
      module: 'payment_method',
      details: {
        paymentMethodCode: code,
        paymentMethodName: method.name,
        amount: amount,
        oldBalance: currentBalance,
        newBalance: newBalance,
        reason: reason
      },
      createdAt: new Date()
    });
    
    return newBalance;
  } catch (error) {
    console.error('Error adjusting payment method balance:', error);
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
    const allAccounts = await db.bankAccounts.toArray();
    const activeAccounts = allAccounts.filter(account => account.isActive === true);
    return activeAccounts.sort((a, b) => a.bankName.localeCompare(b.bankName));
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

// Check if Midtrans is configured
export async function checkMidtransConfig() {
  try {
    const clientKey = await db.settings.where('key').equals('midtrans_client_key').first();
    const serverKey = await db.settings.where('key').equals('midtrans_server_key').first();
    const enabled = await db.settings.where('key').equals('midtrans_enabled').first();
    
    return {
      isConfigured: !!(clientKey?.value && serverKey?.value),
      isEnabled: enabled?.value === true,
      clientKey: clientKey?.value || '',
      serverKey: serverKey?.value || '',
      environment: (await db.settings.where('key').equals('midtrans_environment').first())?.value || 'sandbox'
    };
  } catch (error) {
    console.error('Error checking Midtrans config:', error);
    return { isConfigured: false, isEnabled: false };
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
  deleteBankAccount,
  checkMidtransConfig,
  updatePaymentMethodBalance,
  updatePaymentMethodBalanceById,
  getPaymentMethodBalance,
  getTotalBalance,
  adjustPaymentMethodBalance
};