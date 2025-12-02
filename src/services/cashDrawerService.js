import db from '../config/database';
import { generateCashDrawerSessionId } from '../utils/generators';
import { logActivity } from './activityLogService';

// Get active cash drawer session
export async function getActiveSession() {
  try {
    const session = await db.cashDrawer
      .where('status')
      .equals('open')
      .first();
    
    return session || null;
  } catch (error) {
    console.error('Error fetching active session:', error);
    throw new Error('Gagal mengambil sesi kasir aktif');
  }
}

// Open cash drawer (start shift)
export async function openCashDrawer(openingBalance, notes = '') {
  try {
    // Check if there's already an open session
    const activeSession = await getActiveSession();
    if (activeSession) {
      throw new Error('Kasir sudah dibuka. Tutup kasir terlebih dahulu.');
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const sessionId = await generateCashDrawerSessionId();
    
    const session = {
      sessionId,
      cashierId: currentUser.id || null,
      cashierName: currentUser.fullName || 'Admin',
      openingBalance: parseFloat(openingBalance) || 0,
      closingBalance: 0,
      expectedBalance: 0,
      actualBalance: 0,
      difference: 0,
      totalCash: 0,
      totalCard: 0,
      totalQris: 0,
      totalTransactions: 0,
      status: 'open',
      openedAt: new Date(),
      closedAt: null,
      openingNotes: notes,
      closingNotes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await db.cashDrawer.add(session);
    
    // Log activity
    await logActivity({
      userId: currentUser.id,
      action: 'open',
      module: 'cash_drawer',
      description: `Membuka kasir dengan saldo awal ${openingBalance}`,
      metadata: { sessionId, openingBalance }
    });
    
    return { id, ...session };
    
  } catch (error) {
    console.error('Error opening cash drawer:', error);
    throw error;
  }
}

// Close cash drawer (end shift)
export async function closeCashDrawer(actualBalance, closingNotes = '') {
  try {
    const session = await getActiveSession();
    
    if (!session) {
      throw new Error('Tidak ada sesi kasir yang aktif');
    }
    
    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const transactions = await db.transactions
      .where('transactionDate')
      .between(today, new Date())
      .and(t => t.status === 'completed')
      .toArray();
    
    // Calculate totals
    const totalCash = transactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.total, 0);
    
    const totalCard = transactions
      .filter(t => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.total, 0);
    
    const totalQris = transactions
      .filter(t => t.paymentMethod === 'qris')
      .reduce((sum, t) => sum + t.total, 0);
    
    const totalTransactions = transactions.length;
    const closingBalance = session.openingBalance + totalCash;
    const expectedBalance = closingBalance;
    const difference = parseFloat(actualBalance) - expectedBalance;
    
    // Update session
    await db.cashDrawer.update(session.id, {
      closingBalance,
      expectedBalance,
      actualBalance: parseFloat(actualBalance),
      difference,
      totalCash,
      totalCard,
      totalQris,
      totalTransactions,
      status: 'closed',
      closedAt: new Date(),
      closingNotes,
      updatedAt: new Date()
    });
    
    // Log activity
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    await logActivity({
      userId: currentUser.id,
      action: 'close',
      module: 'cash_drawer',
      description: `Menutup kasir dengan saldo akhir ${actualBalance}`,
      metadata: {
        sessionId: session.sessionId,
        expectedBalance,
        actualBalance,
        difference
      }
    });
    
    return await db.cashDrawer.get(session.id);
    
  } catch (error) {
    console.error('Error closing cash drawer:', error);
    throw error;
  }
}

// Get cash drawer history
export async function getCashDrawerHistory() {
  try {
    const history = await db.cashDrawer.toArray();
    return history.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  } catch (error) {
    console.error('Error fetching cash drawer history:', error);
    throw new Error('Gagal mengambil riwayat kasir');
  }
}

// Get cash drawer by session ID
export async function getCashDrawerBySessionId(sessionId) {
  try {
    const session = await db.cashDrawer
      .where('sessionId')
      .equals(sessionId)
      .first();
    
    if (!session) {
      throw new Error('Sesi kasir tidak ditemukan');
    }
    
    return session;
  } catch (error) {
    console.error('Error fetching cash drawer session:', error);
    throw error;
  }
}

// Get cash drawer statistics
export async function getCashDrawerStats(startDate, endDate) {
  try {
    let sessions = await db.cashDrawer
      .where('status')
      .equals('closed')
      .toArray();
    
    // Filter by date range if provided
    if (startDate) {
      sessions = sessions.filter(s => 
        new Date(s.openedAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      sessions = sessions.filter(s => 
        new Date(s.closedAt) <= new Date(endDate)
      );
    }
    
    const totalSessions = sessions.length;
    const totalRevenue = sessions.reduce((sum, s) => 
      sum + s.totalCash + s.totalCard + s.totalQris, 0
    );
    const totalCash = sessions.reduce((sum, s) => sum + s.totalCash, 0);
    const totalCard = sessions.reduce((sum, s) => sum + s.totalCard, 0);
    const totalQris = sessions.reduce((sum, s) => sum + s.totalQris, 0);
    const totalTransactions = sessions.reduce((sum, s) => sum + s.totalTransactions, 0);
    const totalDifference = sessions.reduce((sum, s) => sum + s.difference, 0);
    
    return {
      totalSessions,
      totalRevenue,
      totalCash,
      totalCard,
      totalQris,
      totalTransactions,
      totalDifference,
      averageRevenue: totalSessions > 0 ? totalRevenue / totalSessions : 0,
      averageTransactions: totalSessions > 0 ? totalTransactions / totalSessions : 0
    };
    
  } catch (error) {
    console.error('Error fetching cash drawer stats:', error);
    throw new Error('Gagal mengambil statistik kasir');
  }
}

export default {
  getActiveSession,
  openCashDrawer,
  closeCashDrawer,
  getCashDrawerHistory,
  getCashDrawerBySessionId,
  getCashDrawerStats
};