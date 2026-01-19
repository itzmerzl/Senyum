import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all units
 */
export const getAllUnits = async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ message: 'Failed to fetch units' });
    }
};

/**
 * Get unit by ID
 */
export const getUnitById = async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await prisma.unit.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        res.json(unit);
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ message: 'Failed to fetch unit' });
    }
};

/**
 * Create new unit
 */
export const createUnit = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Unit name is required' });
        }

        // Check for duplicate
        const existing = await prisma.unit.findUnique({
            where: { name: name.trim() }
        });

        if (existing) {
            return res.status(400).json({ message: 'Unit with this name already exists' });
        }

        const unit = await prisma.unit.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null
            }
        });

        res.status(201).json(unit);
    } catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ message: 'Failed to create unit' });
    }
};

/**
 * Update unit
 */
export const updateUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if unit exists
        const existing = await prisma.unit.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Check for duplicate name (if name is being changed)
        if (name && name !== existing.name) {
            const duplicate = await prisma.unit.findUnique({
                where: { name: name.trim() }
            });

            if (duplicate) {
                return res.status(400).json({ message: 'Unit with this name already exists' });
            }
        }

        const unit = await prisma.unit.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name: name.trim() }),
                description: description !== undefined ? (description?.trim() || null) : undefined
            }
        });

        res.json(unit);
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ message: 'Failed to update unit' });
    }
};

/**
 * Delete unit
 */
export const deleteUnit = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if unit exists
        const unit = await prisma.unit.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Check if unit is in use
        if (unit._count.products > 0) {
            return res.status(400).json({
                message: `Cannot delete unit. ${unit._count.products} product(s) are using this unit.`
            });
        }

        await prisma.unit.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ message: 'Failed to delete unit' });
    }
};
