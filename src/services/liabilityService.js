import api from '../utils/apiClient';

// Get all liabilities
export const getAllLiabilities = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);

        let liabilities = await api.get(`liabilities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);

        // Join with students. FETCH ALL to ensure mapping works.
        const studentsResponse = await api.get('students?limit=10000');
        const studentsData = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse.data || []);

        // Normalize keys to string to prevent type mismatch (1 vs "1")
        const studentMap = new Map(studentsData.map(s => [String(s.id), s]));

        liabilities = liabilities.map(l => {
            const amount = l.amount || 0;
            const paidAmount = l.paidAmount || 0;
            const remainingAmount = amount - paidAmount;

            // Normalize lookup key
            const student = studentMap.get(String(l.studentId));

            return {
                ...l,
                student: student || { fullName: 'Unknown Student', className: '-' },
                totalAmount: amount, // Backend uses 'amount', frontend expects 'totalAmount'
                remainingAmount: remainingAmount > 0 ? remainingAmount : 0
            };
        });

        // Filter by student name
        if (filters.studentName) {
            const search = filters.studentName.toLowerCase();
            liabilities = liabilities.filter(l =>
                l.student.fullName.toLowerCase().includes(search)
            );
        }

        // Sort by due date (nearest first)
        return liabilities.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } catch (error) {
        console.error('Error getting liabilities:', error);
        throw error;
    }
};

// Get liabilities by student ID
export const getLiabilitiesByStudent = async (studentId) => {
    try {
        const liabilities = await api.get(`liabilities?studentId=${studentId}`);

        // Check overdue status dynamically and calculate remaining amounts
        const now = new Date();
        return liabilities.map(l => {
            const isOverdue = l.status !== 'paid' && new Date(l.dueDate) < now;
            const amount = l.amount || 0;
            const paidAmount = l.paidAmount || 0;
            const remainingAmount = amount - paidAmount;

            return {
                ...l,
                isOverdue,
                totalAmount: amount,  // Backend uses 'amount', frontend expects 'totalAmount'
                remainingAmount: remainingAmount > 0 ? remainingAmount : 0 // Safety check
            };
        });
    } catch (error) {
        console.error('Error getting student liabilities:', error);
        throw error;
    }
};

// Create new liability
export const createLiability = async (data) => {
    try {
        const liability = {
            ...data,
            paidAmount: 0,
            remainingAmount: parseInt(data.totalAmount || data.amount),
            amount: parseFloat(data.amount || data.totalAmount),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return await api.post('liabilities', liability);
    } catch (error) {
        console.error('Error creating liability:', error);
        throw error;
    }
};

// Create bulk liabilities
export const createBulkLiabilities = async (studentIds, liabilityData) => {
    try {
        const liabilities = studentIds.map(studentId => ({
            ...liabilityData,
            studentId,
            paidAmount: 0,
            remainingAmount: parseInt(liabilityData.totalAmount || liabilityData.amount),
            amount: parseFloat(liabilityData.amount || liabilityData.totalAmount),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        await api.post('liabilities/bulk', liabilities);
        return true;
    } catch (error) {
        console.error('Error creating bulk liabilities:', error);
        throw error;
    }
};

// Process payment (Cicilan)
export const processLiabilityPayment = async (paymentData) => {
    try {
        // We use the new complex endpoint in backend
        return await api.post('liabilities/pay', paymentData);
    } catch (error) {
        console.error('Error processing liability payment:', error);
        throw error;
    }
};

// Get payment history for a liability
export const getLiabilityPayments = async (liabilityId) => {
    try {
        const payments = await api.get(`payments?liabilityId=${liabilityId}`);
        return payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    } catch (error) {
        console.error('Error getting payments:', error);
        throw error;
    }
};

// Get Stats
export const getLiabilityStats = async () => {
    try {
        const liabilities = await api.get('liabilities');
        const payments = await api.get('payments');

        const totalReceivable = liabilities.reduce((sum, l) => sum + (l.amount || 0), 0);
        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalOutstanding = totalReceivable - totalCollected;

        const paidCount = liabilities.filter(l => l.status === 'paid').length;
        const pendingCount = liabilities.length - paidCount;

        return {
            totalReceivable,
            totalCollected,
            totalOutstanding,
            paidCount,
            pendingCount
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        throw error;
    }
};
// Delete liability
export const deleteLiability = async (id) => {
    try {
        await api.delete(`liabilities/${id}`);
    } catch (error) {
        console.error('Error deleting liability:', error);
        throw error;
    }
};

// Bulk Update Fulfillment
export const bulkUpdateFulfillment = async (liabilityIds, itemNames) => {
    try {
        return await api.post('liabilities/bulk-fulfillment', { liabilityIds, itemNames });
    } catch (error) {
        console.error('Error bulk updating fulfillment:', error);
        throw error;
    }
};

// Cancel/Delete Payment (reverts balances)
export const cancelPayment = async (paymentId) => {
    try {
        return await api.delete(`payments/${paymentId}`);
    } catch (error) {
        console.error('Error canceling payment:', error);
        throw error;
    }
};
