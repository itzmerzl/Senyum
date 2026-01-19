import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sync Script: Fix paidAmount on all liabilities
 * This script recalculates paidAmount from Payment records
 */
async function syncLiabilityPaidAmounts() {
    console.log('🔄 Starting paidAmount sync...');

    try {
        // 1. Get all liabilities
        const liabilities = await prisma.liability.findMany({
            include: {
                payments: true
            }
        });

        console.log(`Found ${liabilities.length} liabilities to check.`);

        let updated = 0;
        let unchanged = 0;

        for (const liability of liabilities) {
            // Calculate actual paid amount from payments
            const actualPaid = liability.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Check if update is needed
            if (liability.paidAmount !== actualPaid) {
                // Determine correct status
                const remaining = liability.amount - actualPaid;
                let newStatus = 'unpaid';
                if (remaining <= 0) {
                    newStatus = 'paid';
                } else if (actualPaid > 0) {
                    newStatus = 'partial';
                }

                // Update liability
                await prisma.liability.update({
                    where: { id: liability.id },
                    data: {
                        paidAmount: actualPaid,
                        status: newStatus
                    }
                });

                console.log(`✅ Liability #${liability.id}: paidAmount ${liability.paidAmount} -> ${actualPaid}, status -> ${newStatus}`);
                updated++;
            } else {
                unchanged++;
            }
        }

        console.log(`\n📊 Sync Complete:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Unchanged: ${unchanged}`);

    } catch (error) {
        console.error('❌ Sync failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncLiabilityPaidAmounts();
