import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get liability details
export const getLiabilityById = async (req, res) => {
    try {
        const { id } = req.params;

        const liability = await prisma.liability.findUnique({
            where: { id: parseInt(id) },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        registrationNumber: true
                    }
                },
                template: true
            }
        });

        if (!liability) {
            return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
        }

        res.json(liability);
    } catch (error) {
        console.error('Get liability error:', error);
        res.status(500).json({ error: 'Gagal mengambil detail tagihan' });
    }
};

// Update fulfillment items
export const updateFulfillment = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // Complete updated items array

        // Validate items
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Format data tidak valid' });
        }

        // Get current liability to preserve other data if needed
        const current = await prisma.liability.findUnique({
            where: { id: parseInt(id) }
        });

        if (!current) {
            return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
        }

        // Prepare items with audit trail for NEW deliveries
        // We trust the client to send the correct state, but we should verify if 'status' changed to 'delivered' to add timestamp
        // However, complex diffing might be overkill. 
        // Strategy: Client sends the updated list. If an item is marked 'delivered' and has no 'deliveredAt', we set it.
        // If it's 'pending', we clear audit.

        const username = req.user?.username || 'Admin'; // From auth middleware

        const updatedItems = items.map(item => {
            if (item.status === 'delivered') {
                return {
                    ...item,
                    deliveredAt: item.deliveredAt || new Date().toISOString(),
                    deliveredBy: item.deliveredBy || username
                };
            } else {
                return {
                    ...item,
                    status: 'pending',
                    deliveredAt: null,
                    deliveredBy: null
                };
            }
        });

        const updated = await prisma.liability.update({
            where: { id: parseInt(id) },
            data: {
                items: updatedItems
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update fulfillment error:', error);
        res.status(500).json({ error: 'Gagal update status barang' });
    }
};

// Delete liability and update student balance
export const deleteLiability = async (req, res) => {
    try {
        const { id } = req.params;

        const liability = await prisma.liability.findUnique({
            where: { id: parseInt(id) }
        });

        if (!liability) {
            return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
        }

        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // 1. Delete the liability
            await tx.liability.delete({
                where: { id: parseInt(id) }
            });

            // 2. Decrement student stats
            // We only subtract the REMAINING amount from balance?
            // "totalLiabilities" tracks the GROSS amount billed.
            // "balance" tracks the OUTSTANDING amount.

            // So:
            // totalLiabilities -= liability.amount
            // balance -= (liability.amount - liability.paidAmount)
            // But wait, if paidAmount > 0, we should probably delete the payments too? Or keep them as 'orphan' payments?
            // Usually, if we delete a bill, we should check if it has payments.
            // If it has payments, maybe we shouldn't allow delete? Or we refund them?

            // For now, assuming simple delete (cleanup):
            // We just revert the impact on the student.

            const outstanding = liability.amount - liability.paidAmount;

            await tx.student.update({
                where: { id: liability.studentId },
                data: {
                    totalLiabilities: { decrement: liability.amount },
                    balance: { decrement: outstanding }
                }
            });

            // Log
            await tx.studentHistory.create({
                data: {
                    studentId: liability.studentId,
                    action: 'liability_deleted',
                    module: 'liability',
                    description: `Tagihan deleted: ${liability.title} (${liability.amount})`,
                    performedBy: req.user?.username || 'System'
                }
            });
        });

        res.json({ message: 'Tagihan berhasil dihapus' });
    } catch (error) {
        console.error('Delete liability error:', error);
        res.status(500).json({ error: 'Gagal menghapus tagihan' });
    }
};
/**
 * Bulk update fulfillment items for multiple liabilities
 * @body { liabilityIds: number[], itemNames: string[] }
 */
export const bulkUpdateFulfillment = async (req, res) => {
    try {
        const { liabilityIds, itemNames } = req.body;

        if (!Array.isArray(liabilityIds) || liabilityIds.length === 0) {
            return res.status(400).json({ error: 'Pilih minimal satu tagihan' });
        }

        if (!Array.isArray(itemNames) || itemNames.length === 0) {
            return res.status(400).json({ error: 'Pilih minimal satu item' });
        }

        const username = req.user?.username || 'Admin';
        const now = new Date().toISOString();

        let updatedCount = 0;

        // Process each liability
        for (const liabilityId of liabilityIds) {
            const liability = await prisma.liability.findUnique({
                where: { id: parseInt(liabilityId) }
            });

            if (!liability || !liability.items) continue;

            // Update matching items
            const items = liability.items;
            let hasChanges = false;

            const updatedItems = items.map(item => {
                if (itemNames.includes(item.name) && item.status !== 'delivered') {
                    hasChanges = true;
                    return {
                        ...item,
                        status: 'delivered',
                        deliveredAt: now,
                        deliveredBy: username
                    };
                }
                return item;
            });

            if (hasChanges) {
                await prisma.liability.update({
                    where: { id: parseInt(liabilityId) },
                    data: { items: updatedItems }
                });
                updatedCount++;
            }
        }

        res.json({
            success: true,
            message: `Berhasil update ${updatedCount} tagihan`,
            updatedCount
        });
    } catch (error) {
        console.error('Bulk fulfillment error:', error);
        res.status(500).json({ error: 'Gagal update status barang' });
    }
};

export default {
    getLiabilityById,
    updateFulfillment,
    deleteLiability,
    bulkUpdateFulfillment
};
