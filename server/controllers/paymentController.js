import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Delete payment and revert balances
 * - Reverts Liability.paidAmount
 * - Reverts Student.balance and totalPaid
 * - Updates Liability.status if needed
 */
export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(id) },
            include: { liability: true }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Delete the payment
            await tx.payment.delete({
                where: { id: parseInt(id) }
            });

            // 2. Revert liability paidAmount if linked
            if (payment.liabilityId && payment.liability) {
                const newPaidAmount = payment.liability.paidAmount - payment.amount;
                const newStatus = newPaidAmount <= 0 ? 'unpaid' : 'partial';

                await tx.liability.update({
                    where: { id: payment.liabilityId },
                    data: {
                        paidAmount: Math.max(0, newPaidAmount),
                        status: newStatus
                    }
                });
            }

            // 3. Revert student balance
            await tx.student.update({
                where: { id: payment.studentId },
                data: {
                    balance: { increment: payment.amount },
                    totalPaid: { decrement: payment.amount }
                }
            });

            // 4. Log
            await tx.studentHistory.create({
                data: {
                    studentId: payment.studentId,
                    action: 'payment_deleted',
                    module: 'payment',
                    description: `Pembayaran ${payment.receiptNumber} (${payment.amount}) dihapus`,
                    performedBy: req.user?.username || 'System'
                }
            });
        });

        res.json({ message: 'Pembayaran berhasil dihapus dan saldo dikembalikan' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Gagal menghapus pembayaran' });
    }
};

/**
 * Get all payments (with filters)
 */
export const getAllPayments = async (req, res) => {
    try {
        const { studentId, liabilityId } = req.query;
        const where = {};

        if (studentId) where.studentId = parseInt(studentId);
        if (liabilityId) where.liabilityId = parseInt(liabilityId);

        const payments = await prisma.payment.findMany({
            where,
            include: {
                student: { select: { id: true, fullName: true, className: true } },
                liability: { select: { id: true, title: true } }
            },
            orderBy: { paymentDate: 'desc' }
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
    }
};

export default {
    deletePayment,
    getAllPayments
};
