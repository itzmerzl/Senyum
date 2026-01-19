import api from '../utils/apiClient';

/**
 * Fetch dashboard statistics and data
 * @param {Object} params - Query parameters (period, topPeriod)
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboardStats(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const data = await api.get(`dashboard/stats${query ? `?${query}` : ''}`);
        return data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error('Gagal mengambil data dashboard');
    }
}

/**
 * Fetch liabilities summary for dashboard
 * @returns {Promise<Object>} Liabilities summary
 */
export async function getLiabilitiesSummary() {
    try {
        const data = await api.get('dashboard/liabilities-summary');
        return data;
    } catch (error) {
        console.error('Error fetching liabilities summary:', error);
        return { totalOutstanding: 0, studentsCount: 0, overdueCount: 0, overdueAmount: 0, recentLiabilities: [] };
    }
}

/**
 * Fetch cash flow summary for dashboard
 * @returns {Promise<Object>} Cash flow data
 */
export async function getCashFlow() {
    try {
        const data = await api.get('dashboard/cash-flow');
        return data;
    } catch (error) {
        console.error('Error fetching cash flow:', error);
        return { todayIncome: 0, currentCash: 0, openingBalance: 0, cashInDrawer: false, drawerStatus: 'closed' };
    }
}

/**
 * Fetch performance metrics for dashboard
 * @returns {Promise<Object>} Performance metrics
 */
export async function getPerformanceMetrics() {
    try {
        const data = await api.get('dashboard/performance-metrics');
        return data;
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        return { avgTransactionValue: 0, topMarginProducts: [], peakHours: [] };
    }
}

export default {
    getDashboardStats,
    getLiabilitiesSummary,
    getCashFlow,
    getPerformanceMetrics
};
