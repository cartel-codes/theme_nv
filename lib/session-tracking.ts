import { prisma } from './prisma';

export interface SessionMetadata {
  ip?: string;
  userAgent?: string;
  userId: string;
}

/**
 * Create a tracked session in the database
 */
export async function createTrackedSession(options: {
  userId: string;
  sessionToken: string;
  ip?: string;
  userAgent?: string;
  expiresIn?: number; // milliseconds
}) {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + (options.expiresIn || 24 * 60 * 60 * 1000));

  return prisma.adminSession.create({
    data: {
      userId: options.userId,
      sessionToken: options.sessionToken,
      ip: options.ip,
      userAgent: options.userAgent,
      expiresAt,
    },
  });
}

/**
 * Get session by token
 */
export async function getSessionByToken(token: string) {
  return prisma.adminSession.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Update last activity for a session
 */
export async function updateSessionActivity(token: string) {
  try {
    return await prisma.adminSession.update({
      where: { sessionToken: token },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.error('[SESSION_UPDATE_ERROR]', error);
    return null;
  }
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(token: string) {
  return prisma.adminSession.delete({
    where: { sessionToken: token },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return prisma.adminSession.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string) {
  const result = await prisma.adminSession.deleteMany({
    where: { userId },
  });

  return result.count;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.adminSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get session statistics
 */
export async function getSessionStats() {
  const now = new Date();

  const [activeSessions, expiredSessions, totalSessions] = await Promise.all([
    prisma.adminSession.count({
      where: {
        expiresAt: {
          gt: now,
        },
      },
    }),
    prisma.adminSession.count({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    }),
    prisma.adminSession.count(),
  ]);

  const sessionsByUser = await prisma.adminSession.groupBy({
    by: ['userId'],
    where: {
      expiresAt: {
        gt: now,
      },
    },
    _count: true,
  });

  return {
    activeSessions,
    expiredSessions,
    totalSessions,
    activeUsers: sessionsByUser.length,
    sessionsPerUser: sessionsByUser.map((s) => ({
      userId: s.userId,
      sessionCount: s._count,
    })),
  };
}

/**
 * Check if a session is valid and not expired
 */
export async function isSessionValid(token: string): Promise<boolean> {
  try {
    const session = await getSessionByToken(token);
    if (!session) return false;

    // Check if expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await invalidateSession(token);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
