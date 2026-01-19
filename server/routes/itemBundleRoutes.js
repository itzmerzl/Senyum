import express from 'express';
import * as itemBundleController from '../controllers/itemBundleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (admin only)
router.use(authenticate);
router.use(authorize(['admin', 'superadmin']));

router.get('/', itemBundleController.getAllBundles);
router.post('/', itemBundleController.createBundle);
router.put('/:id', itemBundleController.updateBundle);
router.delete('/:id', itemBundleController.deleteBundle);

export default router;

