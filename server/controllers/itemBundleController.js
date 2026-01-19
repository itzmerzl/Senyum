import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllBundles = async (req, res) => {
    try {
        const bundles = await prisma.itemBundle.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(bundles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBundle = async (req, res) => {
    const { name, description, items } = req.body;
    try {
        const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

        const bundle = await prisma.itemBundle.create({
            data: {
                name,
                description,
                items, // Json array
                totalPrice
            }
        });
        res.status(201).json(bundle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateBundle = async (req, res) => {
    const { id } = req.params;
    const { name, description, items } = req.body;
    try {
        const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

        const bundle = await prisma.itemBundle.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                items,
                totalPrice
            }
        });
        res.json(bundle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBundle = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.itemBundle.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Bundle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
