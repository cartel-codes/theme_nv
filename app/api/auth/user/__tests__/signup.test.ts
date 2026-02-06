import { POST } from '@/app/api/auth/user/signup/route';
import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/user-auth';
import { logUserAuditEvent } from '@/lib/user-auth';

jest.mock('@/lib/user-auth');
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 10, retryAfterMs: 0 }),
  SIGNUP_RATE_LIMIT: { maxAttempts: 3, windowMs: 3600000 },
}));

describe('POST /api/auth/user/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create account successfully with valid data', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'hashed_password',
      isActive: true,
      emailVerified: false,
      avatar: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue(mockUser);
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const mockSession = { sessionToken: 'session-token-123', userId: 'user-1' };
    const { createUserSession } = await import('@/lib/user-auth');
    (createUserSession as jest.Mock).mockResolvedValue(mockSession);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/signup'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe('user@example.com');
    expect(data.sessionToken).toBe('session-token-123');
    expect(createUser).toHaveBeenCalledWith(
      'user@example.com',
      'Password123',
      'John',
      'Doe'
    );
  });

  it('should reject if user already exists', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'user@example.com',
    };

    (getUserByEmail as jest.Mock).mockResolvedValue(existingUser);
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/signup'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User already exists');
    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        action: 'SIGNUP',
        status: 'failed',
      })
    );
  });

  it('should fail with missing email or password', async () => {
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/signup'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          // password missing
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should reject weak passwords', async () => {
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/signup'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'weak', // less than 8 characters
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('at least 8 characters');
  });

  it('should log audit event on successful signup', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'hashed_password',
      isActive: true,
      emailVerified: false,
      avatar: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue(mockUser);
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const mockSession = { sessionToken: 'session-token-123' };
    const { createUserSession } = await import('@/lib/user-auth');
    (createUserSession as jest.Mock).mockResolvedValue(mockSession);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/signup'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123',
        }),
      }
    );

    await POST(req);

    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'SIGNUP',
        status: 'success',
      })
    );
  });
});
