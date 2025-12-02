import db from '../config/database';
import { generateInvoiceNumber } from '../utils/generators';
import { logActivity } from './activityLogService';

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
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber('INV');
    
    // Get current user (cashier)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Prepare transaction object
    const transaction = {
      invoiceNumber,
      transactionDate: new Date(),
      customerType: transactionData.customerType || 'general',
      customerId: transactionData.customerId || null,
      customerName: transactionData.customerName || 'Umum',
      items: transactionData.items,
      subtotal: transactionData.subtotal,
      tax: transactionData.tax || 0,
      discount: transactionData.discount || 0,
      total: transactionData.total,
      paymentMethod: transactionData.paymentMethod,
      paidAmount: transactionData.paidAmount,
      changeAmount: transactionData.changeAmount || 0,
      status: 'completed',
      cashierId: currentUser.id || null,
      cashierName: currentUser.fullName || 'Admin',
      notes: transactionData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save transaction
    const transactionId = await db.transactions.add(transaction);
    
    // Update product stock
    for (const item of transactionData.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: product.stock - item.quantity,
          updatedAt: new Date()
        });
        
        // Add stock movement record
        await db.stockMovements.add({
          productId: item.productId,
          productName: item.productName,
          movementType: 'out',
          quantity: item.quantity,
          reference: `Penjualan - ${invoiceNumber}`,
          referenceId: transactionId,
          notes: `Penjualan kepada ${transaction.customerName}`,
          createdBy: currentUser.id || null,
          createdAt: new Date()
        });
      }
    }
    
    // Log activity
    await logActivity({
      userId: currentUser.id,
      action: 'create',
      module: 'transactions',
      description: `Membuat transaksi ${invoiceNumber}`,
      metadata: {
        transactionId,
        invoiceNumber,
        total: transaction.total,
        itemCount: transaction.items.length
      }
    });
    
    // Return complete transaction
    return {
      id: transactionId,
      ...transaction
    };
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Gagal membuat transaksi: ' + error.message);
  }
}

// Cancel/void transaction
export async function cancelTransaction(id, reason) {
  try {
    const transaction = await db.transactions.get(id);
    
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan');
    }
    
    if (transaction.status === 'cancelled') {
      throw new Error('Transaksi sudah dibatalkan');
    }
    
    // Update status
    await db.transactions.update(id, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date()
    });
    
    // Kembalikan stok produk
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
          productName: item.productName,
          movementType: 'in',
          quantity: item.quantity,
          reference: `Pembatalan: ${transaction.invoiceNumber}`,
          referenceId: id,
          notes: `Pembatalan transaksi - ${reason}`,
          createdAt: new Date()
        });
      }
    }
    
    // Log activity
    await logActivity({
      action: 'cancel',
      module: 'transactions',
      description: `Membatalkan transaksi ${transaction.invoiceNumber}`,
      metadata: { transactionId: id, reason }
    });
    
    return { success: true, message: 'Transaksi berhasil dibatalkan' };
    
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    throw error;
  }
}

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
      card: completedTransactions.filter(t => t.paymentMethod === 'card').length,
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
    const totalCard = completedTransactions
      .filter(t => t.paymentMethod === 'card')
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
      totalCard,
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
  cancelTransaction,
  getTransactionStats,
  getTodayTransactions,
  getTransactionsByCustomer,
  getTransactionsByDateRange,
  exportTransactions,
  getDailySalesReport
};