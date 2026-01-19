import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Centralized Audit Service
 * Use this service to log all important actions across the application
 */

// Action types
export const AuditAction = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'export',
    IMPORT: 'import',
    VIEW: 'view',
    APPROVE: 'approve',
    REJECT: 'reject',
    VOID: 'void',
    REFUND: 'refund',
    PAYMENT: 'payment',
    PROMOTE: 'promote',
    RESET: 'reset'
};

// Module types
export const AuditModule = {
    AUTH: 'auth',
    POS: 'pos',
    PRODUCT: 'product',
    INVENTORY: 'inventory',
    STUDENT: 'student',
    LIABILITY: 'liability',
    TRANSACTION: 'transaction',
    USER: 'user',
    SETTING: 'setting',
    REPORT: 'report',
    SYSTEM: 'system'
};

// Severity levels
export const AuditSeverity = {
    INFO: 'info',           // Normal operations
    WARNING: 'warning',     // Important changes
    CRITICAL: 'critical'    // Security/financial critical
};

/**
 * Log an audit trail entry
 * @param {Object} options - Audit log options
 * @param {number} options.userId - ID of the user performing the action
 * @param {string} options.userName - Username snapshot
 * @param {string} options.action - Action type (use AuditAction enum)
 * @param {string} options.module - Module name (use AuditModule enum)
 * @param {string} options.description - Human-readable description
 * @param {string} options.entityType - Type of entity affected
 * @param {number} options.entityId - ID of the entity affected
 * @param {string} options.entityName - Name of the entity (snapshot)
 * @param {Object} options.oldValue - Previous state (for updates)
 * @param {Object} options.newValue - New state (for creates/updates)
 * @param {Object} options.details - Additional metadata
 * @param {string} options.severity - Severity level
 * @param {string} options.ipAddress - Client IP address
 * @param {string} options.userAgent - Client user agent
 */
export const logAudit = async ({
    userId = null,
    userName = null,
    action,
    module,
    description = null,
    entityType = null,
    entityId = null,
    entityName = null,
    oldValue = null,
    newValue = null,
    details = null,
    severity = AuditSeverity.INFO,
    ipAddress = null,
    userAgent = null
}) => {
    try {
        const log = await prisma.activityLog.create({
            data: {
                userId,
                userName,
                action,
                module,
                description,
                entityType,
                entityId,
                entityName,
                oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
                newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                severity,
                ipAddress,
                userAgent
            }
        });

        // Log critical events to console
        if (severity === AuditSeverity.CRITICAL) {
            console.log(`[AUDIT CRITICAL] ${module}.${action}: ${description} by ${userName || 'system'}`);
        }

        return log;
    } catch (error) {
        console.error('[Audit] Failed to log audit:', error.message);
        return null;
    }
};

/**
 * Helper to extract request context (IP, user agent)
 */
export const getRequestContext = (req) => ({
    ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
    userAgent: req?.headers?.['user-agent'] || 'unknown',
    userId: req?.user?.id || null,
    userName: req?.user?.username || null
});

/**
 * Middleware to attach audit context to request
 */
export const auditMiddleware = (req, res, next) => {
    req.auditContext = getRequestContext(req);
    next();
};

/**
 * Quick audit helpers for common operations
 */
export const audit = {
    // Auth events
    login: (userId, userName, req, success = true) => logAudit({
        ...getRequestContext(req),
        userId,
        userName,
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        description: success ? 'Login berhasil' : 'Login gagal',
        severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING
    }),

    logout: (userId, userName, req) => logAudit({
        ...getRequestContext(req),
        userId,
        userName,
        action: AuditAction.LOGOUT,
        module: AuditModule.AUTH,
        description: 'Logout'
    }),

    // CRUD operations
    create: (module, entityType, entityId, entityName, newValue, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.CREATE,
        module,
        entityType,
        entityId,
        entityName,
        newValue,
        description: `Membuat ${entityType} baru: ${entityName}`
    }),

    update: (module, entityType, entityId, entityName, oldValue, newValue, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.UPDATE,
        module,
        entityType,
        entityId,
        entityName,
        oldValue,
        newValue,
        description: `Mengupdate ${entityType}: ${entityName}`
    }),

    delete: (module, entityType, entityId, entityName, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.DELETE,
        module,
        entityType,
        entityId,
        entityName,
        description: `Menghapus ${entityType}: ${entityName}`,
        severity: AuditSeverity.WARNING
    }),

    // Financial operations (critical)
    transaction: (transactionId, amount, type, req) => logAudit({
        ...getRequestContext(req),
        action: type,
        module: AuditModule.TRANSACTION,
        entityType: 'Transaction',
        entityId: transactionId,
        description: `Transaksi ${type}: Rp ${amount.toLocaleString('id-ID')}`,
        severity: AuditSeverity.CRITICAL
    }),

    payment: (liabilityId, amount, studentName, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.PAYMENT,
        module: AuditModule.LIABILITY,
        entityType: 'Payment',
        entityId: liabilityId,
        entityName: studentName,
        description: `Pembayaran tagihan: Rp ${amount.toLocaleString('id-ID')}`,
        severity: AuditSeverity.CRITICAL
    }),

    void: (transactionId, reason, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.VOID,
        module: AuditModule.TRANSACTION,
        entityType: 'Transaction',
        entityId: transactionId,
        description: `Void transaksi: ${reason}`,
        severity: AuditSeverity.CRITICAL,
        details: { reason }
    }),

    // Settings (critical)
    settingChange: (settingKey, oldValue, newValue, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.UPDATE,
        module: AuditModule.SETTING,
        entityType: 'Setting',
        entityName: settingKey,
        oldValue: { value: oldValue },
        newValue: { value: newValue },
        description: `Mengubah setting: ${settingKey}`,
        severity: AuditSeverity.WARNING
    }),

    // User management (critical)
    userAction: (action, targetUserId, targetUserName, details, req) => logAudit({
        ...getRequestContext(req),
        action,
        module: AuditModule.USER,
        entityType: 'User',
        entityId: targetUserId,
        entityName: targetUserName,
        description: `${action} user: ${targetUserName}`,
        details,
        severity: AuditSeverity.CRITICAL
    }),

    // Data export/import
    dataExport: (module, recordCount, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.EXPORT,
        module,
        description: `Export data ${module}: ${recordCount} records`,
        severity: AuditSeverity.WARNING
    }),

    dataImport: (module, recordCount, req) => logAudit({
        ...getRequestContext(req),
        action: AuditAction.IMPORT,
        module,
        description: `Import data ${module}: ${recordCount} records`,
        severity: AuditSeverity.WARNING
    })
};

export default { logAudit, audit, getRequestContext, auditMiddleware, AuditAction, AuditModule, AuditSeverity };
