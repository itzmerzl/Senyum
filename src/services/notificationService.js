import api from '../utils/apiClient';

export const getNotifications = async (limit = 10, unreadOnly = false) => {
    try {
        const query = `limit=${limit}&unreadOnly=${unreadOnly}`;
        const response = await api.get(`notifications?${query}`);
        return response || { notifications: [], unreadCount: 0 };
    } catch (error) {
        // Fallback silently if auth error, or user not logged in, to avoid console spam
        console.warn('Notification fetch warning:', error.message);
        return { notifications: [], unreadCount: 0 };
    }
};

export const markAsRead = async (id) => {
    try {
        const response = await api.put(`notifications/${id}/read`);
        return response;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
    }
};
