import api from '../utils/apiClient';

// Get all payment methods
export async function getAllPaymentMethods() {
  try {
    const methods = await api.get('paymentMethods');
    return methods.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran');
  }
}

// Get active payment methods only
export async function getActivePaymentMethods() {
  try {
    const methods = await api.get('paymentMethods?isActive=true');
    return methods.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    throw new Error('Gagal mengambil metode pembayaran aktif');
  }
}

/**
 * Get payment method by code
 */
export async function getPaymentMethodByCode(code) {
  try {
    const methods = await api.get(`paymentMethods?code=${code}`);
    return methods[0] || null;
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

    // Validate Midtrans requirement (Settings call)
    if (methodData.requiresMidtrans) {
      const midtransEnabled = await api.get('settings?key=midtrans_enabled');
      if (!midtransEnabled || midtransEnabled.length === 0 || !midtransEnabled[0].value) {
        throw new Error('Midtrans belum dikonfigurasi. Aktifkan Midtrans di Settings terlebih dahulu.');
      }
    }

    const method = {
      ...methodData,
      balance: 0,
      isActive: methodData.isActive !== false,
      displayOrder: parseInt(methodData.displayOrder) || 999,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await api.post('paymentMethods', method);
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
}

// Update payment method
export async function updatePaymentMethod(id, methodData) {
  try {
    const updated = await api.put(`paymentMethods/${id}`, {
      ...methodData,
      updatedAt: new Date().toISOString()
    });
    return updated;
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
}

// Delete payment method
export async function deletePaymentMethod(id) {
  try {
    const method = await api.get(`paymentMethods/${id}`);
    if (!method) throw new Error('Metode pembayaran tidak ditemukan');

    // Check if used in transactions
    const transactions = await api.get(`transactions?paymentMethod=${method.code}`);
    if (transactions.length > 0) {
      throw new Error(`Metode pembayaran ini digunakan di ${transactions.length} transaksi. Tidak dapat dihapus.`);
    }

    await api.delete(`paymentMethods/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}

// Toggle payment method status
export async function togglePaymentMethodStatus(id) {
  try {
    const method = await api.get(`paymentMethods/${id}`);
    if (!method) throw new Error('Metode pembayaran tidak ditemukan');

    const newStatus = !method.isActive;

    await api.put(`paymentMethods/${id}`, {
      isActive: newStatus,
      updatedAt: new Date().toISOString()
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
    await api.put(`paymentMethods/${id}`, {
      displayOrder: newOrder,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating display order:', error);
    throw error;
  }
}

/**
 * Update payment method balance
 */
export async function updatePaymentMethodBalance(code, amount, type = 'add') {
  try {
    const method = await getPaymentMethodByCode(code);
    if (!method) throw new Error(`Metode pembayaran "${code}" tidak ditemukan`);

    const currentBalance = parseFloat(method.balance) || 0;
    const newBalance = type === 'add'
      ? currentBalance + amount
      : currentBalance - amount;

    await api.put(`paymentMethods/${method.id}`, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Log activity
    await api.post('activityLogs', {
      userId: 1,
      action: type === 'add' ? 'balance_increase' : 'balance_decrease',
      module: 'payment_method',
      description: `${type === 'add' ? 'Penambahan' : 'Pengurangan'} saldo ${method.name} senilai ${amount}`,
      metadata: JSON.stringify({ code, amount, oldBalance: currentBalance, newBalance }),
      createdAt: new Date().toISOString()
    });

    return newBalance;
  } catch (error) {
    console.error('Error updating payment method balance:', error);
    throw error;
  }
}

/**
 * Update payment method balance by ID
 */
export async function updatePaymentMethodBalanceById(id, data) {
  try {
    const method = await api.get(`paymentMethods/${id}`);
    if (!method) throw new Error('Metode pembayaran tidak ditemukan');

    let currentBalance = parseFloat(method.balance) || 0;
    let newBalance = currentBalance;

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

    await api.put(`paymentMethods/${id}`, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Log activity
    await api.post('activityLogs', {
      userId: 1,
      action: data.adjustmentType,
      module: 'payment_method',
      description: `Penyesuaian saldo ${method.name}: ${data.adjustmentType}`,
      metadata: JSON.stringify({ id, amount: data.amount, oldBalance: currentBalance, newBalance }),
      createdAt: new Date().toISOString()
    });

    return await api.get(`paymentMethods/${id}`);
  } catch (error) {
    console.error('Error updating payment method balance by ID:', error);
    throw error;
  }
}

// Get payment method balance
export async function getPaymentMethodBalance(code) {
  try {
    const method = await getPaymentMethodByCode(code);
    return parseFloat(method?.balance) || 0;
  } catch (error) {
    console.error('Error getting payment method balance:', error);
    return 0;
  }
}

// Get total balance
export async function getTotalBalance() {
  try {
    const methods = await api.get('paymentMethods');
    return methods.reduce((sum, method) => sum + (parseFloat(method.balance) || 0), 0);
  } catch (error) {
    console.error('Error getting total balance:', error);
    return 0;
  }
}

/**
 * Manual balance adjustment
 */
export async function adjustPaymentMethodBalance(code, amount, reason, userId) {
  try {
    const method = await getPaymentMethodByCode(code);
    if (!method) throw new Error('Metode pembayaran tidak ditemukan');

    const currentBalance = parseFloat(method.balance) || 0;
    const newBalance = currentBalance + amount;

    if (newBalance < 0) throw new Error('Saldo tidak boleh negatif');

    await api.put(`paymentMethods/${method.id}`, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Log adjustment
    await api.post('activityLogs', {
      userId: userId || 1,
      action: 'balance_adjustment',
      module: 'payment_method',
      description: `Penyesuaian saldo manual ${method.name}: ${reason}`,
      metadata: JSON.stringify({ code, amount, oldBalance: currentBalance, newBalance, reason }),
      createdAt: new Date().toISOString()
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
    const accounts = await api.get('bankAccounts');
    return accounts.sort((a, b) => a.bankName.localeCompare(b.bankName));
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw new Error('Gagal mengambil akun bank');
  }
}

// Get active bank accounts
export async function getActiveBankAccounts() {
  try {
    const accounts = await api.get('bankAccounts?isActive=true');
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await api.post('bankAccounts', account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw new Error('Gagal menambahkan akun bank');
  }
}

// Update bank account
export async function updateBankAccount(id, accountData) {
  try {
    return await api.put(`bankAccounts/${id}`, {
      ...accountData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    throw error;
  }
}

// Delete bank account
export async function deleteBankAccount(id) {
  try {
    await api.delete(`bankAccounts/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw new Error('Gagal menghapus akun bank');
  }
}

// Check if Midtrans is configured
export async function checkMidtransConfig() {
  try {
    const settings = await api.get('settings');
    const findSetting = (key) => settings.find(s => s.key === key);

    const clientKey = findSetting('midtrans_client_key');
    const serverKey = findSetting('midtrans_server_key');
    const enabled = findSetting('midtrans_enabled');
    const environment = findSetting('midtrans_environment');

    return {
      isConfigured: !!(clientKey?.value && serverKey?.value),
      isEnabled: enabled?.value === true || enabled?.value === 'true',
      clientKey: clientKey?.value || '',
      serverKey: serverKey?.value || '',
      environment: environment?.value || 'sandbox'
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