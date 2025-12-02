import db from '../config/database';

// Log user activity
export async function logActivity(activityData) {
  try {
    const activity = {
      userId: activityData.userId,
      action: activityData.action, // create, update, delete, login, logout, etc
      module: activityData.module, // transactions, products, students, etc
      description: activityData.description,
      metadata: activityData.metadata || {},
      ipAddress: activityData.ipAddress || null,
      userAgent: activityData.userAgent || navigator.userAgent,
      createdAt: new Date()
    };
    
    const id = await db.activityLogs.add(activity);
    return { id, ...activity };
    
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
}

// Get all activity logs
export async function getAllActivityLogs() {
  try {
    const logs = await db.activityLogs.toArray();
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas');
  }
}

// Get activity logs by user
export async function getActivityLogsByUser(userId) {
  try {
    const logs = await db.activityLogs
      .where('userId')
      .equals(userId)
      .toArray();
    
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas user');
  }
}

// Get activity logs by module
export async function getActivityLogsByModule(module) {
  try {
    const logs = await db.activityLogs
      .where('module')
      .equals(module)
      .toArray();
    
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching module activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas module');
  }
}

// Get activity logs by date range
export async function getActivityLogsByDateRange(startDate, endDate) {
  try {
    const logs = await db.activityLogs
      .where('createdAt')
      .between(new Date(startDate), new Date(endDate))
      .toArray();
    
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    
    const oldLogs = await db.activityLogs
      .where('createdAt')
      .below(cutoffDate)
      .toArray();
    
    const ids = oldLogs.map(log => log.id);
    await db.activityLogs.bulkDelete(ids);
    
    return ids.length;
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