import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Gagal mengambil data kategori' });
    }
};

/**
 * Create category
 */
export const createCategory = async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: req.body
        });
        res.json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Gagal membuat kategori' });
    }
};

/**
 * Update category
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Gagal update kategori' });
    }
};

/**
 * Delete category with validation
 * Prevents deletion if products are linked
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check for linked products
        const linkedProducts = await prisma.product.count({
            where: { categoryId: parseInt(id), deletedAt: null }
        });

        if (linkedProducts > 0) {
            return res.status(400).json({
                error: `Tidak bisa menghapus kategori ini. Masih ada ${linkedProducts} produk yang menggunakan kategori ini.`,
                linkedCount: linkedProducts
            });
        }

        // Soft delete
        await prisma.category.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date(), isActive: false }
        });

        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Gagal menghapus kategori' });
    }
};

export default {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
