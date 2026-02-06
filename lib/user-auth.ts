import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import crypto from 'crypto';
import { jwtEncode, jwtDecode } from './jwt';

// Token expiration times
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Hash a password using bcryptjs with 10 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plain password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) {
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });
}

/**
 * Authenticate user with email and password
 * Returns user without password, or null if authentication fails
 */
export async function authenticateUser(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get user by ID without password
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
) {
  const hashedPassword = await hashPassword(newPassword);

  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      updatedAt: true,
    },
  });
}

/**
 * Verify user email
 */
export async function verifyUserEmail(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });
}

/**
 * Create a user session
 */
export async function createUserSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  deviceName?: string
) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      ip: ipAddress,
      userAgent,
      deviceName,
      expiresAt,
    },
  });
}

/**
 * Get user session by token
 */
export async function getUserSession(sessionToken: string) {
  return prisma.userSession.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
          password: true, // Will be filtered out before sending to client
        },
      },
    },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      lastActivity: 'desc',
    },
    select: {
      id: true,
      sessionToken: true,
      ip: true,
      userAgent: true,
      deviceName: true,
      expiresAt: true,
      createdAt: true,
      lastActivity: true,
    },
  });
}

/**
 * Update session last activity
 */
export async function updateUserSessionActivity(sessionToken: string) {
  return prisma.userSession.update({
    where: { sessionToken },
    data: { lastActivity: new Date() },
  });
}

/**
 * Invalidate a specific user session
 */
export async function invalidateUserSession(sessionToken: string) {
  return prisma.userSession.delete({
    where: { sessionToken },
  });
}

/**
 * Invalidate all user sessions (logout from all devices)
 */
export async function invalidateAllUserSessions(userId: string) {
  return prisma.userSession.deleteMany({
    where: { userId },
  });
}

/**
 * Check if a session is valid and not expired
 */
export async function isUserSessionValid(sessionToken: string): Promise<boolean> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await invalidateUserSession(sessionToken).catch(() => {});
    return false;
  }

  return true;
}

/**
 * Get user session statistics
 */
export async function getUserSessionStats(userId: string) {
  const activeSessions = await prisma.userSession.count({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  const expiredSessions = await prisma.userSession.count({
    where: {
      userId,
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  const totalSessions = await prisma.userSession.count({
    where: { userId },
  });

  return {
    active: activeSessions,
    expired: expiredSessions,
    total: totalSessions,
  };
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredUserSessions() {
  return prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}

/**
 * Log user audit event
 */
export async function logUserAuditEvent(data: {
  userId?: string;
  email?: string;
  action: string;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}) {
  try {
    return await prisma.userAuditLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        action: data.action,
        ip: data.ip,
        userAgent: data.userAgent,
        status: data.status,
        errorMessage: data.errorMessage,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Error logging user audit event:', error);
  }
}

/**
 * Get user audit logs with pagination and filtering
 */
export async function getUserAuditLogs(filters?: {
  userId?: string;
  email?: string;
  action?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.email) where.email = { contains: filters.email, mode: 'insensitive' };
  if (filters?.action) where.action = filters.action;
  if (filters?.status) where.status = filters.status;

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters?.startDate) where.createdAt.gte = filters.startDate;
    if (filters?.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userAuditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get failed login attempts
 */
export async function getFailedUserLoginAttempts(filters?: {
  email?: string;
  userId?: string;
  limit?: number;
  hoursBack?: number;
}) {
  const limit = filters?.limit || 10;
  const hoursBack = filters?.hoursBack || 24;

  const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return prisma.userAuditLog.findMany({
    where: {
      action: 'LOGIN_FAILED',
      status: 'failed',
      createdAt: {
        gte: startDate,
      },
      ...(filters?.email && { email: { contains: filters.email, mode: 'insensitive' } }),
      ...(filters?.userId && { userId: filters.userId }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get user audit log statistics
 */
export async function getUserAuditLogStats(userId?: string) {
  const where = userId ? { userId } : {};

  const totalLogs = await prisma.userAuditLog.count({ where });
  const successfulLogins = await prisma.userAuditLog.count({
    where: {
      ...where,
      action: 'LOGIN_SUCCESS',
      status: 'success',
    },
  });
  const failedLogins = await prisma.userAuditLog.count({
    where: {
      ...where,
      action: 'LOGIN_FAILED',
      status: 'failed',
    },
  });

  return {
    totalLogs,
    successfulLogins,
    failedLogins,
    uniqueIPs: 0, // Would need groupBy in a real implementation
  };
}

// ─────────────────────────────────────────────────────────────────────
// Password Reset & Email Verification Token Management
// ─────────────────────────────────────────────────────────────────────

/**
 * Generate and store email verification token for a user
 */
export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = await jwtEncode(
    { userId, type: 'email-verification' },
    '24h'
  );

  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
    },
  });

  return token;
}

/**
 * Verify email verification token and mark email as verified
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    // Decode token
    const payload = await jwtDecode<{ userId: string; type: string }>(token);

    if (payload.type !== 'email-verification') {
      return { success: false, error: 'Invalid token type' };
    }

    // Find user with matching token   
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired verification token' };
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    await logUserAuditEvent({
      userId: user.id,
      email: user.email,
      action: 'EMAIL_VERIFIED',
      status: 'success',
    });

    return { success: true, email: user.email };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'Token verification failed' };
  }
}

/**
 * Generate and store password reset token for a user
 */
export async function generatePasswordResetToken(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal whether the email exists
    return { success: false, error: 'If that email exists, a reset link has been sent' };
  }

  const token = await jwtEncode(
    { userId: user.id, email: user.email, type: 'password-reset' },
    '1h'
  );

  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    },
  });

  await logUserAuditEvent({
    userId: user.id,
    email: user.email,
    action: 'PASSWORD_RESET_REQUESTED',
    status: 'success',
  });

  return { success: true, token };
}

/**
 * Verify password reset token and return user
 */
export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Decode token
    const payload = await jwtDecode<{ userId: string; type: string }>(token);

    if (payload.type !== 'password-reset') {
      return { success: false, error: 'Invalid token type' };
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Password reset token verification error:', error);
    return { success: false, error: 'Token verification failed' };
  }
}

/**
 * Reset password using verified token
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyPasswordResetToken(token);

  if (!verification.success ||!verification.userId) {
    return { success: false, error: verification.error };
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: verification.userId },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Invalidate all existing sessions for security
  await invalidateAllUserSessions(verification.userId);

  const user = await prisma.user.findUnique({
    where: { id: verification.userId },
    select: { email: true },
  });

  if (user) {
    await logUserAuditEvent({
      userId: verification.userId,
      email: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      status: 'success',
    });
  }

  return { success: true };
}
