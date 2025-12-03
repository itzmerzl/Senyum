import db from '../config/database';
import { updatePaymentMethodBalance } from './paymentMethodService';

/**
 * Update transaction
 * @param {number} id - Transaction ID
 * @param {object} data - Update data
 * @returns {Promise<object>}
 */
export const updateTransaction = async (id, data) => {
  try {
    // ✅ CORRECT: Dexie way
    const transaction = await db.transactions.get(id);
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    
    const updatedTransaction = {
      ...transaction,
      ...data,
      updatedAt: new Date()
    };
    
    await db.transactions.put(updatedTransaction);
    
    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Get all transactions
export async function getAllTransactions() {
  try {
    const transactions = await db.transactions.toArray();
    
    // Sort by date descending (newest first)
    return transactions.sort((a, b) => 
      new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Gagal mengambil data transaksi');
  }
}

// Get transaction by ID
export async function getTransactionById(id) {
  try {
    const transaction = await db.transactions.get(id);
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    return transaction;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

// Get transaction by invoice number
export async function getTransactionByInvoice(invoiceNumber) {
  try {
    const transaction = await db.transactions
      .where('invoiceNumber')
      .equals(invoiceNumber)
      .first();
    
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    return transaction;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

// Create new transaction
export async function createTransaction(transactionData) {
  try {
    // Validate & prepare transaction
    const transaction = {
      invoiceNumber: `INV${Date.now()}`,
      transactionDate: new Date(),
      ...transactionData,
      status: transactionData.status || 'completed',
      cashierId: transactionData.cashierId || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save transaction
    const transactionId = await db.transactions.add(transaction);
    
    // Update stock for each item
    for (const item of transaction.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: product.stock - item.quantity,
          updatedAt: new Date()
        });
        
        // Log stock movement
        await db.stockMovements.add({
          productId: item.productId,
          movementType: 'out',
          quantity: item.quantity,
          reference: transaction.invoiceNumber,
          notes: `Penjualan - ${transaction.invoiceNumber}`,
          createdAt: new Date()
        });
      }
    }
    
    // ✅ UPDATE BALANCE: Only for completed transactions
    if (transaction.status === 'completed') {
      await updatePaymentMethodBalance(
        transaction.paymentMethod, 
        transaction.total,
        'add'
      );
    }
    
    // Log activity
    await db.activityLogs.add({
      userId: transaction.cashierId,
      action: 'create_transaction',
      module: 'pos',
      details: {
        invoiceNumber: transaction.invoiceNumber,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        itemCount: transaction.items.length
      },
      createdAt: new Date()
    });
    
    return { id: transactionId, ...transaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Refund transaction
 * @param {number} id - Transaction ID
 * @param {object} refundData - Refund details
 * @returns {Promise<object>}
 */
export const refundTransaction = async (id, refundData) => {
  try {
    // ✅ CORRECT: Get transaction using Dexie
    const transaction = await db.transactions.get(id);
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    
    if (transaction.status !== 'completed') {
      throw new Error('Hanya transaksi selesai yang bisa di-refund');
    }
    
    // Restore stock for each item
    for (const item of transaction.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: product.stock + item.quantity,
          updatedAt: new Date()
        });
        
        // Log stock movement
        await db.stockMovements.add({
          productId: item.productId,
          movementType: 'in',
          quantity: item.quantity,
          reference: `REFUND-${transaction.invoiceNumber}`,
          notes: `Refund - ${transaction.invoiceNumber}`,
          createdAt: new Date()
        });
      }
    }
    
    // ✅ REDUCE BALANCE dari payment method
    await updatePaymentMethodBalance(
      transaction.paymentMethod,
      refundData.refundAmount || transaction.total,
      'subtract'
    );
    
    // Update transaction status
    const updatedTransaction = {
      ...transaction,
      status: 'refunded',
      refundAmount: refundData.refundAmount || transaction.total,
      refundReason: refundData.reason,
      refundMethod: refundData.refundMethod,
      refundedAt: new Date(),
      refundedBy: 'Admin', // TODO: Get from auth context
      updatedAt: new Date()
    };
    
    await db.transactions.put(updatedTransaction);
    
    // Log activity
    await db.activityLogs.add({
      userId: 1, // TODO: Get from auth
      action: 'refund_transaction',
      module: 'transactions',
      details: {
        invoiceNumber: transaction.invoiceNumber,
        refundAmount: refundData.refundAmount || transaction.total,
        reason: refundData.reason
      },
      createdAt: new Date()
    });
    
    return updatedTransaction;
  } catch (error) {
    console.error('Error refunding transaction:', error);
    throw error;
  }
};

/**
 * Cancel transaction
 * @param {number} id - Transaction ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>}
 */
export const cancelTransaction = async (id, reason) => {
  try {
    // ✅ CORRECT: Get transaction using Dexie
    const transaction = await db.transactions.get(id);
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    
    if (transaction.status === 'cancelled') {
      throw new Error('Transaksi sudah dibatalkan');
    }
    
    // Restore stock for each item (karena stok sudah dikurangi saat create)
    for (const item of transaction.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: product.stock + item.quantity,
          updatedAt: new Date()
        });
        
        // Log stock movement
        await db.stockMovements.add({
          productId: item.productId,
          movementType: 'in',
          quantity: item.quantity,
          reference: `CANCEL-${transaction.invoiceNumber}`,
          notes: `Pembatalan - ${transaction.invoiceNumber}`,
          createdAt: new Date()
        });
      }
    }
    
    // ✅ REDUCE BALANCE jika transaksi sudah completed
    if (transaction.status === 'completed') {
      await updatePaymentMethodBalance(
        transaction.paymentMethod,
        transaction.total,
        'subtract'
      );
    }
    
    // Update transaction status
    const updatedTransaction = {
      ...transaction,
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: 'Admin', // TODO: Get from auth context
      updatedAt: new Date()
    };
    
    await db.transactions.put(updatedTransaction);
    
    // Log activity
    await db.activityLogs.add({
      userId: 1, // TODO: Get from auth
      action: 'cancel_transaction',
      module: 'transactions',
      details: {
        invoiceNumber: transaction.invoiceNumber,
        total: transaction.total,
        reason: reason
      },
      createdAt: new Date()
    });
    
    return updatedTransaction;
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    throw error;
  }
};

// Get transaction statistics
export async function getTransactionStats(startDate, endDate) {
  try {
    let transactions = await db.transactions.toArray();
    
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
    
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.total, 0);
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
    
    // Top selling products
    const productSales = {};
    completedTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
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
    
    const transactions = await db.transactions
      .where('transactionDate')
      .between(today, new Date())
      .toArray();
    
    return transactions.sort((a, b) => 
      new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  } catch (error) {
    console.error('Error fetching today transactions:', error);
    throw new Error('Gagal mengambil transaksi hari ini');
  }
}

// Get transactions by customer
export async function getTransactionsByCustomer(customerId, customerType) {
  try {
    const transactions = await db.transactions
      .where('customerId')
      .equals(customerId)
      .and(t => t.customerType === customerType)
      .toArray();
    
    return transactions.sort((a, b) => 
      new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  } catch (error) {
    console.error('Error fetching customer transactions:', error);
    throw new Error('Gagal mengambil transaksi pelanggan');
  }
}

// Get transactions by date range
export async function getTransactionsByDateRange(startDate, endDate) {
  try {
    const transactions = await db.transactions
      .where('transactionDate')
      .between(new Date(startDate), new Date(endDate))
      .toArray();
    
    return transactions.sort((a, b) => 
      new Date(b.transactionDate) - new Date(a.transactionDate)
    );
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
      'Jumlah Item': t.items.length,
      'Subtotal': t.subtotal,
      'Pajak': t.tax,
      'Diskon': t.discount,
      'Total': t.total,
      'Metode Bayar': t.paymentMethod.toUpperCase(),
      'Dibayar': t.paidAmount,
      'Kembalian': t.changeAmount,
      'Status': t.status === 'completed' ? 'Selesai' : 'Dibatalkan',
      'Kasir': t.cashierName
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
    
    const transactions = await db.transactions
      .where('transactionDate')
      .between(startOfDay, endOfDay)
      .toArray();
    
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCash = completedTransactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.total, 0);
    const totalBank = completedTransactions
      .filter(t => t.paymentMethod === 'bank')
      .reduce((sum, t) => sum + t.total, 0);
    const totalQris = completedTransactions
      .filter(t => t.paymentMethod === 'qris')
      .reduce((sum, t) => sum + t.total, 0);
    
    return {
      date,
      totalTransactions: completedTransactions.length,
      cancelledTransactions: transactions.filter(t => t.status === 'cancelled').length,
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