import { prisma } from './prisma';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SIGNUP_SUCCESS'
  | 'SIGNUP_FAILED'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  | 'SESSION_EXPIRED';

export interface AuditLogEntry {
  userId?: string;
  email?: string;
  action: AuditAction;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log authentication and security events
 */
export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        userId: entry.userId,
        email: entry.email,
        action: entry.action,
        ip: entry.ip,
        userAgent: entry.userAgent,
        status: entry.status,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    // Log to console if database logging fails
    console.error('[AUDIT_LOG_ERROR]', error, entry);
  }
}

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(options?: {
  userId?: string;
  email?: string;
  action?: AuditAction;
  status?: 'success' | 'failed';
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: {
        ...(options?.userId && { userId: options.userId }),
        ...(options?.email && { email: options.email }),
        ...(options?.action && { action: options.action }),
        ...(options?.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          } as any,
        },
      },
    }),
    prisma.adminAuditLog.count({
      where: {
        ...(options?.userId && { userId: options.userId }),
        ...(options?.email && { email: options.email }),
        ...(options?.action && { action: options.action }),
        ...(options?.status && { status: options.status }),
      },
    }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
    total,
    limit,
    offset,
  };
}

/**
 * Get recent login attempts
 */
export async function getRecentLoginAttempts(email: string, limit: number = 10) {
  return prisma.adminAuditLog.findMany({
    where: {
      email,
      action: 'LOGIN_SUCCESS',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get failed login attempts (potential brute force)
 */
export async function getFailedLoginAttempts(options?: {
  email?: string;
  ip?: string;
  minutes?: number;
  limit?: number;
}) {
  const minutes = options?.minutes || 60;
  const limit = options?.limit || 50;
  const since = new Date(Date.now() - minutes * 60 * 1000);

  return prisma.adminAuditLog.findMany({
    where: {
      action: 'LOGIN_FAILED',
      status: 'failed',
      createdAt: {
        gte: since,
      },
      ...(options?.email && { email: options.email }),
      ...(options?.ip && { ip: options.ip }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Delete old audit logs (for maintenance)
 */
export async function deleteOldAuditLogs(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.adminAuditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.adminAuditLog.findMany({
    where: {
      createdAt: {
        gte: since,
      },
    },
  });

  const stats = {
    total: logs.length,
    loginSuccess: logs.filter((l) => l.action === 'LOGIN_SUCCESS' && l.status === 'success').length,
    loginFailed: logs.filter((l) => l.action === 'LOGIN_FAILED' || l.status === 'failed').length,
    logout: logs.filter((l) => l.action === 'LOGOUT').length,
    signupSuccess: logs.filter((l) => l.action === 'SIGNUP_SUCCESS').length,
    signupFailed: logs.filter((l) => l.action === 'SIGNUP_FAILED').length,
    uniqueUsers: new Set(logs.map((l) => l.userId).filter(Boolean)).size,
    uniqueEmails: new Set(logs.map((l) => l.email).filter(Boolean)).size,
    uniqueIPs: new Set(logs.map((l) => l.ip).filter(Boolean)).size,
  };

  return stats;
}
