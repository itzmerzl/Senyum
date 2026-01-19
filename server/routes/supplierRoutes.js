import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import supplierController from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', authenticate, supplierController.getAllSuppliers);
router.post('/', authenticate, authorize(['admin', 'superadmin']), supplierController.createSupplier);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), supplierController.updateSupplier);
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), supplierController.deleteSupplier);

export default router;
