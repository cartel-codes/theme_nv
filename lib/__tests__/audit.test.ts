import {
  logAuditEvent,
  getAuditLogs,
  getRecentLoginAttempts,
  getFailedLoginAttempts,
  getAuditLogStats,
} from '@/lib/audit';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should log authentication events', async () => {
      (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({
        id: 'log-1',
        action: 'LOGIN_SUCCESS',
        status: 'success',
      });

      await logAuditEvent({
        userId: 'user-123',
        email: 'admin@novraux.com',
        action: 'LOGIN_SUCCESS',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { userName: 'Admin' },
      });

      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          status: 'success',
          userId: 'user-123',
          email: 'admin@novraux.com',
        }),
      });
    });

    it('should handle logging errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.adminAuditLog.create as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      await logAuditEvent({
        action: 'LOGIN_SUCCESS',
        status: 'success',
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN_SUCCESS',
          status: 'success',
          email: 'admin@novraux.com',
          user: { id: 'user-1', email: 'admin@novraux.com', name: 'Admin' },
          metadata: JSON.stringify({ test: true }),
        },
      ];

      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.adminAuditLog.count as jest.Mock).mockResolvedValue(1);

      const result = await getAuditLogs({
        limit: 50,
        offset: 0,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.adminAuditLog.findMany).toHaveBeenCalled();
    });

    it('should filter audit logs by action', async () => {
      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.adminAuditLog.count as jest.Mock).mockResolvedValue(0);

      await getAuditLogs({
        action: 'LOGIN_FAILED',
        limit: 50,
      });

      expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'LOGIN_FAILED',
          }),
        })
      );
    });

    it('should filter audit logs by status', async () => {
      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.adminAuditLog.count as jest.Mock).mockResolvedValue(0);

      await getAuditLogs({
        status: 'failed',
        limit: 50,
      });

      expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'failed',
          }),
        })
      );
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should retrieve failed login attempts', async () => {
      const mockFailures = [
        {
          id: 'log-1',
          email: 'attacker@example.com',
          action: 'LOGIN_FAILED',
          status: 'failed',
          ip: '192.168.1.50',
        },
      ];

      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(
        mockFailures
      );

      const result = await getFailedLoginAttempts({
        minutes: 60,
        limit: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('failed');
    });

    it('should detect suspicious accounts', async () => {
      const mockFailures = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `log-${i}`,
          email: 'attacker@example.com',
          action: 'LOGIN_FAILED',
          status: 'failed',
        }));

      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(
        mockFailures
      );

      const result = await getFailedLoginAttempts({
        minutes: 60,
      });

      expect(result.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getAuditLogStats', () => {
    it('should calculate audit statistics', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN_SUCCESS',
          status: 'success',
          userId: 'user-1',
          email: 'admin@novraux.com',
          ip: '192.168.1.1',
        },
        {
          id: 'log-2',
          action: 'LOGIN_FAILED',
          status: 'failed',
          userId: null,
          email: 'unknown@example.com',
          ip: '192.168.1.50',
        },
      ];

      (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(
        mockLogs
      );

      const stats = await getAuditLogStats(7);

      expect(stats.total).toBe(2);
      expect(stats.loginSuccess).toBe(1);
      expect(stats.loginFailed).toBeGreaterThan(0);
      expect(stats.uniqueUsers).toBe(1);
      expect(stats.uniqueEmails).toBe(2);
      expect(stats.uniqueIPs).toBe(2);
    });
  });
});
