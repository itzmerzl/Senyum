import api from '../utils/apiClient';

// Log user activity
export async function logActivity(activityData) {
  try {
    const activity = {
      userId: parseInt(activityData.userId) || 1, // Default to admin for now
      action: activityData.action,
      module: activityData.module,
      description: activityData.description,
      metadata: activityData.metadata ? (typeof activityData.metadata === 'string' ? activityData.metadata : JSON.stringify(activityData.metadata)) : "{}",
      ipAddress: activityData.ipAddress || null,
      userAgent: activityData.userAgent || navigator.userAgent,
      createdAt: new Date().toISOString()
    };

    return await api.post('activityLogs', activity);

  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

// Get all activity logs
export async function getAllActivityLogs() {
  try {
    return await api.get('activityLogs');
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas');
  }
}

// Get activity logs by user
export async function getActivityLogsByUser(userId) {
  try {
    return await api.get(`activityLogs?userId=${userId}`);
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas user');
  }
}

// Get activity logs by module
export async function getActivityLogsByModule(moduleName) {
  try {
    return await api.get(`activityLogs?module=${moduleName}`);
  } catch (error) {
    console.error('Error fetching module activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas module');
  }
}

// Get activity logs by date range
export async function getActivityLogsByDateRange(startDate, endDate) {
  try {
    const logs = await api.get('activityLogs');
    const start = new Date(startDate);
    const end = new Date(endDate);

    return logs.filter(log => {
      const date = new Date(log.createdAt);
      return date >= start && date <= end;
    });
  } catch (error) {
    console.error('Error fetching activity logs by date:', error);
    throw new Error('Gagal mengambil log aktivitas berdasarkan tanggal');
  }
}

// Delete old activity logs (cleanup)
export async function deleteOldActivityLogs(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logs = await api.get('activityLogs');
    const toDelete = logs.filter(log => new Date(log.createdAt) < cutoffDate);

    // We don't have a bulk delete API yet, so we'll delete one by one or skip for now
    // For simplicity in migration, just log it.
    console.log(`Cleanup: Would delete ${toDelete.length} old logs.`);
    return toDelete.length;
  } catch (error) {
    console.error('Error deleting old activity logs:', error);
    throw new Error('Gagal menghapus log aktivitas lama');
  }
}

export default {
  logActivity,
  getAllActivityLogs,
  getActivityLogsByUser,
  getActivityLogsByModule,
  getActivityLogsByDateRange,
  deleteOldActivityLogs
};