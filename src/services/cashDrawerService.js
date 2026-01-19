import api from '../utils/apiClient';
import { generateCashDrawerSessionId } from '../utils/generators';

// Get active cash drawer session
export async function getActiveSession() {
  try {
    const sessions = await api.get('cashDrawer?status=open');
    return sessions[0] || null;
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
    const sessionId = generateCashDrawerSessionId();

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
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingNotes: notes,
      closingNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newSession = await api.post('cashDrawer', session);

    // Log activity
    await api.post('activityLogs', {
      userId: currentUser.id || 1,
      action: 'open',
      module: 'cash_drawer',
      description: `Membuka kasir dengan saldo awal ${openingBalance}`,
      metadata: JSON.stringify({ sessionId, openingBalance }),
      createdAt: new Date().toISOString()
    });

    return newSession;

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

    // Get today's transactions from API
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTransactions = await api.get('transactions');
    const transactions = allTransactions.filter(t =>
      new Date(t.transactionDate) >= today &&
      t.status === 'completed'
    );

    // Calculate totals
    const totalCash = transactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const totalCard = transactions
      .filter(t => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const totalQris = transactions
      .filter(t => t.paymentMethod === 'qris')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const totalTransactions = transactions.length;
    const closingBalance = (parseFloat(session.openingBalance) || 0) + totalCash;
    const expectedBalance = closingBalance;
    const difference = parseFloat(actualBalance) - expectedBalance;

    // Update session via API
    const updatedSession = await api.put(`cashDrawer/${session.id}`, {
      closingBalance,
      expectedBalance,
      actualBalance: parseFloat(actualBalance),
      difference,
      totalCash,
      totalCard,
      totalQris,
      totalTransactions,
      status: 'closed',
      closedAt: new Date().toISOString(),
      closingNotes,
      updatedAt: new Date().toISOString()
    });

    // Log activity
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    await api.post('activityLogs', {
      userId: currentUser.id || 1,
      action: 'close',
      module: 'cash_drawer',
      description: `Menutup kasir dengan saldo akhir ${actualBalance}`,
      metadata: JSON.stringify({
        sessionId: session.sessionId,
        expectedBalance,
        actualBalance,
        difference
      }),
      createdAt: new Date().toISOString()
    });

    return updatedSession;

  } catch (error) {
    console.error('Error closing cash drawer:', error);
    throw error;
  }
}

// Get cash drawer history
export async function getCashDrawerHistory() {
  try {
    const history = await api.get('cashDrawer');
    return history.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  } catch (error) {
    console.error('Error fetching cash drawer history:', error);
    throw new Error('Gagal mengambil riwayat kasir');
  }
}

// Get cash drawer by session ID
export async function getCashDrawerBySessionId(sessionId) {
  try {
    const sessions = await api.get(`cashDrawer?sessionId=${sessionId}`);
    if (sessions.length === 0) {
      throw new Error('Sesi kasir tidak ditemukan');
    }
    return sessions[0];
  } catch (error) {
    console.error('Error fetching cash drawer session:', error);
    throw error;
  }
}

// Get cash drawer statistics
export async function getCashDrawerStats(startDate, endDate) {
  try {
    let sessions = await api.get('cashDrawer?status=closed');

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
      sum + (parseFloat(s.totalCash) || 0) + (parseFloat(s.totalCard) || 0) + (parseFloat(s.totalQris) || 0), 0
    );
    const totalCash = sessions.reduce((sum, s) => sum + (parseFloat(s.totalCash) || 0), 0);
    const totalCard = sessions.reduce((sum, s) => sum + (parseFloat(s.totalCard) || 0), 0);
    const totalQris = sessions.reduce((sum, s) => sum + (parseFloat(s.totalQris) || 0), 0);
    const totalTransactions = sessions.reduce((sum, s) => sum + (parseInt(s.totalTransactions) || 0), 0);
    const totalDifference = sessions.reduce((sum, s) => sum + (parseFloat(s.difference) || 0), 0);

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