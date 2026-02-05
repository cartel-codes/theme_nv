import {
  createTrackedSession,
  getSessionByToken,
  updateSessionActivity,
  invalidateSession,
  getUserSessions,
  invalidateUserSessions,
  cleanupExpiredSessions,
  getSessionStats,
  isSessionValid,
} from '@/lib/session-tracking';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('Session Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrackedSession', () => {
    it('should create a tracked session', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-123',
        sessionToken: 'token-uuid',
        expiresAt: new Date(),
      };

      (prisma.adminSession.create as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await createTrackedSession({
        userId: 'user-123',
        sessionToken: 'token-uuid',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.userId).toBe('user-123');
      expect(prisma.adminSession.create).toHaveBeenCalled();
    });

    it('should set expiration time correctly', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-123',
        sessionToken: 'token-uuid',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      (prisma.adminSession.create as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await createTrackedSession({
        userId: 'user-123',
        sessionToken: 'token-uuid',
        expiresIn: 24 * 60 * 60 * 1000,
      });

      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('getSessionByToken', () => {
    it('should retrieve session with user data', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-123',
        sessionToken: 'token-uuid',
        expiresAt: new Date(),
        user: {
          id: 'user-123',
          email: 'admin@novraux.com',
          name: 'Admin',
          role: 'admin',
        },
      };

      (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await getSessionByToken('token-uuid');

      expect(result.user.email).toBe('admin@novraux.com');
      expect(prisma.adminSession.findUnique).toHaveBeenCalledWith({
        where: { sessionToken: 'token-uuid' },
        include: expect.any(Object),
      });
    });
  });

  describe('updateSessionActivity', () => {
    it('should update last activity timestamp', async () => {
      const mockSession = {
        id: 'session-1',
        lastActivity: new Date(),
      };

      (prisma.adminSession.update as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await updateSessionActivity('token-uuid');

      expect(result.lastActivity).toBeDefined();
      expect(prisma.adminSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionToken: 'token-uuid' },
        })
      );
    });
  });

  describe('invalidateSession', () => {
    it('should delete session from database', async () => {
      (prisma.adminSession.delete as jest.Mock).mockResolvedValue({
        id: 'session-1',
      });

      await invalidateSession('token-uuid');

      expect(prisma.adminSession.delete).toHaveBeenCalledWith({
        where: { sessionToken: 'token-uuid' },
      });
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all active sessions for user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          id: 'session-2',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      ];

      (prisma.adminSession.findMany as jest.Mock).mockResolvedValue(
        mockSessions
      );

      const result = await getUserSessions('user-123');

      expect(result).toHaveLength(2);
      expect(prisma.adminSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });
  });

  describe('invalidateUserSessions', () => {
    it('should logout user from all devices', async () => {
      (prisma.adminSession.deleteMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      const result = await invalidateUserSessions('user-123');

      expect(result).toBe(3);
      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      (prisma.adminSession.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const result = await cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          expiresAt: expect.any(Object),
        }),
      });
    });
  });

  describe('getSessionStats', () => {
    it('should retrieve session statistics', async () => {
      (prisma.adminSession.count as jest.Mock)
        .mockResolvedValueOnce(5) // active sessions
        .mockResolvedValueOnce(2) // expired sessions
        .mockResolvedValueOnce(7); // total sessions

      (prisma.adminSession.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: 2 },
        { userId: 'user-2', _count: 3 },
      ]);

      const stats = await getSessionStats();

      expect(stats.activeSessions).toBe(5);
      expect(stats.expiredSessions).toBe(2);
      expect(stats.totalSessions).toBe(7);
      expect(stats.activeUsers).toBe(2);
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid active session', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          email: 'admin@novraux.com',
          name: 'Admin',
          role: 'admin',
        },
      };

      (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await isSessionValid('token-uuid');

      expect(result).toBe(true);
    });

    it('should return false for expired session', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() - 1000), // expired
        user: {
          id: 'user-123',
          email: 'admin@novraux.com',
          name: 'Admin',
          role: 'admin',
        },
      };

      (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession
      );
      (prisma.adminSession.delete as jest.Mock).mockResolvedValue({});

      const result = await isSessionValid('token-uuid');

      expect(result).toBe(false);
      expect(prisma.adminSession.delete).toHaveBeenCalled();
    });

    it('should return false for non-existent session', async () => {
      (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isSessionValid('invalid-token');

      expect(result).toBe(false);
    });
  });
});
