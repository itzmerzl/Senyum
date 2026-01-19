import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Get all payments
router.get('/', authenticate, paymentController.getAllPayments);

// Delete payment (with balance revert)
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), paymentController.deletePayment);

export default router;
