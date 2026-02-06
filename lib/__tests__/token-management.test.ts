import {
  generateEmailVerificationToken,
  verifyEmailToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
} from '../user-auth';
import { prisma } from '../prisma';
import { jwtDecode } from '../jwt';

// Mock jose library (ES module issue)
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
  jwtVerify: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT functions
jest.mock('../jwt', () => ({
  jwtEncode: jest.fn().mockResolvedValue('mock.jwt.token'),
  jwtDecode: jest.fn(),
  jwtVerifySafe: jest.fn(),
}));

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      deleteMany: jest.fn(),
    },
    userAuditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Verification', () => {
    describe('generateEmailVerificationToken', () => {
      it('generates and stores email verification token', async () => {
        const userId = 'user_123';
        const mockToken = 'mock.jwt.token';

        (prisma.user.update as jest.Mock).mockResolvedValue({
          id: userId,
          emailVerificationToken: mockToken,
        });

        const token = await generateEmailVerificationToken(userId);

        expect(token).toBeTruthy();
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: expect.objectContaining({
            emailVerificationToken: expect.any(String),
            emailVerificationExpires: expect.any(Date),
          }),
        });
      });

      it('sets expiry to 24 hours from now', async () => {
        const userId = 'user_123';
        
        (prisma.user.update as jest.Mock).mockResolvedValue({
          id: userId,
        });

        await generateEmailVerificationToken(userId);

        const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
        const expiryDate = updateCall.data.emailVerificationExpires;
        const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        expect(Math.abs(expiryDate.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
      });
    });

    describe('verifyEmailToken', () => {
      it('successfully verifies valid token', async () => {
        const token = 'valid.jwt.token';
        const mockUser = {
          id: 'user_123',
          email: 'test@example.com',
          emailVerificationToken: token,
          emailVerificationExpires: new Date(Date.now() + 3600000),
        };

        (jwtDecode as jest.Mock).mockResolvedValue({ userId: 'user_123', type: 'email-verification' });
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, emailVerified: true });

        const result = await verifyEmailToken(token);

        expect(result.success).toBe(true);
        expect(result.email).toBe('test@example.com');
      });

      it('rejects expired token', async () => {
        const token = 'expired.jwt.token';

        (jwtDecode as jest.Mock).mockResolvedValue({ userId: 'user_123', type: 'email-verification' });
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await verifyEmailToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or expired verification token');
      });

      it('rejects invalid token', async () => {
        const token = 'invalid.jwt.token';

        (jwtDecode as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const result = await verifyEmailToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Token verification failed');
      });

      it('rejects token with wrong type', async () => {
        const token = 'wrong.type.token';

        (jwtDecode as jest.Mock).mockResolvedValue({ userId: 'user_123', type: 'password-reset' });

        const result = await verifyEmailToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid token type');
      });
    });
  });

  describe('Password Reset', () => {
    describe('generatePasswordResetToken', () => {
      it('generates and stores password reset token', async () => {
        const email = 'test@example.com';
        const mockUser = { id: 'user_123', email };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, passwordResetToken: 'mock.jwt.token' });

        const result = await generatePasswordResetToken(email);

        expect(result.success).toBe(true);
        expect(result.token).toBeTruthy();
      });

      it('returns error for non-existent user', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await generatePasswordResetToken('nonexistent@example.com');

        expect(result.success).toBe(false);
        expect(result.error).toBe('If that email exists, a reset link has been sent');
      });
    });

    describe('verifyPasswordResetToken', () => {
      it('successfully verifies valid token', async () => {
        const token = 'valid.jwt.token';
        const mockUser = {
          id: 'user_123',
          passwordResetToken: token,
          passwordResetExpires: new Date(Date.now() + 3600000),
        };

        (jwtDecode as jest.Mock).mockResolvedValue({ userId: 'user_123', type: 'password-reset' });
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await verifyPasswordResetToken(token);

        expect(result.success).toBe(true);
        expect(result.userId).toBe('user_123');
      });

      it('rejects invalid token', async () => {
        (jwtDecode as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const result = await verifyPasswordResetToken('invalid.jwt.token');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Token verification failed');
      });
    });

    describe('resetPasswordWithToken', () => {
      it('successfully resets password and invalidates sessions', async () => {
        const token = 'valid.jwt.token';
        const mockUser = {
          id: 'user_123',
          passwordResetExpires: new Date(Date.now() + 3600000),
        };

        (jwtDecode as jest.Mock).mockResolvedValue({ userId: 'user_123', type: 'password-reset' });
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userSession.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
        (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

        const result = await resetPasswordWithToken(token, 'NewSecurePass123');

        expect(result.success).toBe(true);
        expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_123' } });
      });

      it('rejects invalid token', async () => {
        (jwtDecode as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const result = await resetPasswordWithToken('invalid.jwt.token', 'NewPassword123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Token verification failed');
      });
    });
  });
});
