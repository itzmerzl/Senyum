import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import liabilityController from '../controllers/liabilityController.js';

const router = express.Router();

// Get liability details
router.get('/:id', authenticate, liabilityController.getLiabilityById);

// Update fulfillment items
router.patch('/:id/fulfillment', authenticate, authorize(['admin', 'superadmin']), liabilityController.updateFulfillment);

// Delete liability
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), liabilityController.deleteLiability);

// Bulk update fulfillment items
router.post('/bulk-fulfillment', authenticate, authorize(['admin', 'superadmin']), liabilityController.bulkUpdateFulfillment);

export default router;
