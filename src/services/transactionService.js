import api from '../utils/apiClient';

/**
 * Update transaction
 */
export const updateTransaction = async (id, data) => {
  try {
    return await api.put(`transactions/${id}`, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Get all transactions
export async function getAllTransactions() {
  try {
    return await api.get('transactions');
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Gagal mengambil data transaksi');
  }
}

// Get transaction by ID
export async function getTransactionById(id) {
  try {
    return await api.get(`transactions/${id}`);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

// Get transaction by invoice number
export async function getTransactionByInvoice(invoiceNumber) {
  try {
    const transactions = await api.get(`transactions?invoiceNumber=${invoiceNumber}`);
    if (transactions.length === 0) throw new Error('Transaksi tidak ditemukan');
    return transactions[0];
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

// Create new transaction (Checkout)
export async function createTransaction(transactionData) {
  try {
    // We use the new complex endpoint in backend
    return await api.post('transactions/checkout', transactionData);
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Refund transaction
 */
export const refundTransaction = async (id, refundData) => {
  try {
    // For refund, we might need a specific endpoint too, but for now we'll do it manually or via generic update
    // Given the complexity of stock restoration, ideally this should be a backend endpoint too.
    // However, to save time, I'll assume generic update works for status, 
    // and stock restoration should be handled by a dedicated endpoint.
    // Let's call it /api/transactions/refund
    return await api.post(`transactions/${id}/refund`, refundData);
  } catch (error) {
    // If endpoint doesn't exist yet, we'll get 404. 
    // I should add it to backend as well.
    console.error('Error refunding transaction:', error);
    throw error;
  }
};

/**
 * Cancel transaction
 */
export const cancelTransaction = async (id, reason) => {
  try {
    return await api.post(`transactions/${id}/cancel`, { reason });
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    throw error;
  }
};

// Get transaction statistics
export async function getTransactionStats(startDate, endDate) {
  try {
    let transactions = await api.get('transactions');

    // Filter by date range if provided
    if (startDate) {
      transactions = transactions.filter(t =>
        new Date(t.transactionDate) >= new Date(startDate)
      );
    }
    if (endDate) {
      transactions = transactions.filter(t =>
        new Date(t.transactionDate) <= new Date(endDate)
      );
    }

    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const cancelledTransactions = transactions.filter(t => t.status === 'cancelled');

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTransactions = completedTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Payment method breakdown
    const paymentMethods = {
      cash: completedTransactions.filter(t => t.paymentMethod === 'cash').length,
      bank: completedTransactions.filter(t => t.paymentMethod === 'bank').length,
      qris: completedTransactions.filter(t => t.paymentMethod === 'qris').length
    };

    // Customer type breakdown
    const customerTypes = {
      general: completedTransactions.filter(t => t.customerType === 'general').length,
      student: completedTransactions.filter(t => t.customerType === 'student').length
    };

    // Top selling products (items is JSON in MySQL)
    const productSales = {};
    completedTransactions.forEach(transaction => {
      const items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName || item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.subtotal;
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      cancelledTransactions: cancelledTransactions.length,
      paymentMethods,
      customerTypes,
      topProducts
    };

  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    throw new Error('Gagal mengambil statistik transaksi');
  }
}

// Get today's transactions
export async function getTodayTransactions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await api.get('transactions');
    return transactions.filter(t => new Date(t.transactionDate) >= today);
  } catch (error) {
    console.error('Error fetching today transactions:', error);
    throw new Error('Gagal mengambil transaksi hari ini');
  }
}

// Get transactions by customer
export async function getTransactionsByCustomer(customerId, customerType) {
  try {
    return await api.get(`transactions?customerId=${customerId}&customerType=${customerType}`);
  } catch (error) {
    console.error('Error fetching customer transactions:', error);
    throw new Error('Gagal mengambil transaksi pelanggan');
  }
}

// Get transactions by date range
export async function getTransactionsByDateRange(startDate, endDate) {
  try {
    const transactions = await api.get('transactions');
    const start = new Date(startDate);
    const end = new Date(endDate);

    return transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d >= start && d <= end;
    });
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    throw new Error('Gagal mengambil transaksi berdasarkan tanggal');
  }
}

// Export transactions to Excel format
export async function exportTransactions(filters = {}) {
  try {
    let transactions = await getAllTransactions();

    // Apply filters
    if (filters.startDate) {
      transactions = transactions.filter(t =>
        new Date(t.transactionDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      transactions = transactions.filter(t =>
        new Date(t.transactionDate) <= new Date(filters.endDate)
      );
    }
    if (filters.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    if (filters.paymentMethod) {
      transactions = transactions.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    if (filters.customerType) {
      transactions = transactions.filter(t => t.customerType === filters.customerType);
    }

    // Format for export
    const exportData = transactions.map(t => ({
      'No Invoice': t.invoiceNumber,
      'Tanggal': new Date(t.transactionDate).toLocaleString('id-ID'),
      'Pelanggan': t.customerName,
      'Tipe Pelanggan': t.customerType === 'student' ? 'Santri' : 'Umum',
      'Jumlah Item': (typeof t.items === 'string' ? JSON.parse(t.items) : t.items)?.length || 0,
      'Subtotal': t.subtotal,
      'Pajak': t.tax,
      'Diskon': t.discount || 0,
      'Total': t.total,
      'Metode Bayar': (t.paymentMethod || '').toUpperCase(),
      'Dibayar': t.paidAmount,
      'Kembalian': t.changeAmount,
      'Status': t.status === 'completed' ? 'Selesai' : 'Dibatalkan',
      'Kasir': t.cashierName || 'Admin'
    }));

    return exportData;

  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw new Error('Gagal export data transaksi');
  }
}

// Get daily sales report
export async function getDailySalesReport(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await api.get('transactions');
    const todayTransactions = transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d >= startOfDay && d <= endOfDay;
    });

    const completedTransactions = todayTransactions.filter(t => t.status === 'completed');

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalCash = completedTransactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    const totalBank = completedTransactions
      .filter(t => t.paymentMethod === 'bank')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    const totalQris = completedTransactions
      .filter(t => t.paymentMethod === 'qris')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return {
      date,
      totalTransactions: completedTransactions.length,
      cancelledTransactions: todayTransactions.filter(t => t.status === 'cancelled').length,
      totalRevenue,
      totalCash,
      totalBank,
      totalQris,
      averageTransaction: completedTransactions.length > 0
        ? totalRevenue / completedTransactions.length
        : 0,
      transactions: completedTransactions
    };

  } catch (error) {
    console.error('Error fetching daily sales report:', error);
    throw new Error('Gagal mengambil laporan penjualan harian');
  }
}

export default {
  getAllTransactions,
  getTransactionById,
  getTransactionByInvoice,
  createTransaction,
  updateTransaction,
  refundTransaction,
  cancelTransaction,
  getTransactionStats,
  getTodayTransactions,
  getTransactionsByCustomer,
  getTransactionsByDateRange,
  exportTransactions,
  getDailySalesReport
};