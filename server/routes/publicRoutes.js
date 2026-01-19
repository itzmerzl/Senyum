import express from 'express';
import rateLimit from 'express-rate-limit';
import { verifyPin } from '../utils/pinHelpers.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiter: Max 5 attempts per 15 minutes per IP
// Prevents brute force attacks on PIN
const billingCheckLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' }
});

/**
 * POST /api/public/check-billing
 * Public endpoint for parents/guardians to check student billing
 * Auth: Registration Number + 6-digit PIN
 */
router.post('/check-billing', billingCheckLimiter, async (req, res) => {
    try {
        const { registrationNumber, pin } = req.body;

        // Input validation
        if (!registrationNumber || !pin) {
            return res.status(400).json({
                error: 'No. Registrasi dan PIN wajib diisi'
            });
        }

        if (pin.length !== 6) {
            return res.status(400).json({
                error: 'PIN harus 6 karakter'
            });
        }

        // Find student by registration number
        const student = await prisma.student.findUnique({
            where: {
                registrationNumber: registrationNumber.toUpperCase().trim()
            },
            include: {
                liabilities: {
                    orderBy: { dueDate: 'asc' }
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 10 // Last 10 payments
                }
            }
        });

        if (!student) {
            return res.status(404).json({
                error: 'No. Registrasi tidak ditemukan'
            });
        }

        // Verify PIN
        const isPinValid = await verifyPin(pin, student.billingPin);

        if (!isPinValid) {
            return res.status(400).json({
                error: 'PIN salah. Silakan coba lagi.'
            });
        }

        // Calculate financial totals
        const totalLiabilities = student.liabilities.reduce((sum, l) => sum + parseFloat(l.amount), 0);
        const totalPaid = student.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const balance = totalLiabilities - totalPaid;

        // Return billing information (sanitized - no sensitive data)
        res.json({
            success: true,
            student: {
                name: student.fullName,
                className: student.className,
                program: student.program,
                registrationNumber: student.registrationNumber
            },
            billing: {
                totalLiabilities,
                totalPaid,
                balance,
                lastPaymentDate: student.lastPaymentDate
            },
            liabilities: student.liabilities.map(l => ({
                id: l.id,
                description: l.title,
                amount: parseFloat(l.amount),
                dueDate: l.dueDate,
                isPaid: l.isPaid
            })),
            recentPayments: student.payments.map(p => ({
                id: p.id,
                amount: parseFloat(p.amount),
                paymentDate: p.paymentDate,
                method: p.method,
                note: p.note
            }))
        });

    } catch (error) {
        console.error('Billing check error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

export default router;
