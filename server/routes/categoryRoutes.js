import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import categoryController from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', authenticate, categoryController.getAllCategories);
router.post('/', authenticate, authorize(['admin', 'superadmin']), categoryController.createCategory);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), categoryController.deleteCategory);

export default router;
