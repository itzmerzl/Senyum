import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get recent notifications
export const getNotifications = async (req, res) => {
    try {
        const { limit = 10, unreadOnly = 'false' } = req.query;

        const where = {};
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        const unreadCount = await prisma.notification.count({
            where: { isRead: false }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        // Fallback if table doesn't exist yet (migration failed)
        console.error('Get notifications error:', error);
        res.json({ notifications: [], unreadCount: 0 });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            await prisma.notification.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
        } else {
            await prisma.notification.update({
                where: { id: parseInt(id) },
                data: { isRead: true }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// Internal: Create notification
export const createNotification = async (type, title, message, link = null, entityType = null, entityId = null) => {
    try {
        await prisma.notification.create({
            data: {
                type,
                title,
                message,
                link,
                entityType,
                entityId
            }
        });
    } catch (error) {
        console.error('Create notification error:', error);
    }
};
