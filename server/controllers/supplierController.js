import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all suppliers
 */
export const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Gagal mengambil data supplier' });
    }
};

/**
 * Create supplier
 */
export const createSupplier = async (req, res) => {
    try {
        const supplier = await prisma.supplier.create({
            data: req.body
        });
        res.json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Gagal membuat supplier' });
    }
};

/**
 * Update supplier
 */
export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(supplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Gagal update supplier' });
    }
};

/**
 * Delete supplier with validation
 * Prevents deletion if products are linked
 */
export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        // Check for linked products
        const linkedProducts = await prisma.product.count({
            where: { supplierId: parseInt(id), deletedAt: null }
        });

        if (linkedProducts > 0) {
            return res.status(400).json({
                error: `Tidak bisa menghapus supplier ini. Masih ada ${linkedProducts} produk dari supplier ini.`,
                linkedCount: linkedProducts
            });
        }

        // Soft delete
        await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date(), isActive: false }
        });

        res.json({ message: 'Supplier berhasil dihapus' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Gagal menghapus supplier' });
    }
};

export default {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
};
