import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all variants for a product
 */
export const getProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;

        const variants = await prisma.productVariant.findMany({
            where: { productId: parseInt(productId) },
            orderBy: { id: 'asc' }
        });

        res.json(variants);
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({ message: 'Failed to fetch variants' });
    }
};

/**
 * Create variant for a product
 */
export const createVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const variantData = req.body;

        const variant = await prisma.productVariant.create({
            data: {
                ...variantData,
                productId: parseInt(productId)
            }
        });

        res.status(201).json(variant);
    } catch (error) {
        console.error('Error creating variant:', error);
        res.status(500).json({ message: 'Failed to create variant', error: error.message });
    }
};

/**
 * Update variant
 */
export const updateVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const variantData = req.body;

        const variant = await prisma.productVariant.update({
            where: { id: parseInt(variantId) },
            data: variantData
        });

        res.json(variant);
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({ message: 'Failed to update variant' });
    }
};

/**
 * Delete variant
 */
export const deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params;

        await prisma.productVariant.delete({
            where: { id: parseInt(variantId) }
        });

        res.json({ message: 'Variant deleted successfully' });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ message: 'Failed to delete variant' });
    }
};
