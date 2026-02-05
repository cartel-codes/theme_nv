import { POST } from '@/app/api/auth/user/login/route';
import { NextRequest } from 'next/server';
import { authenticateUser, createUserSession, logUserAuditEvent } from '@/lib/user-auth';

jest.mock('@/lib/user-auth');

describe('POST /api/auth/user/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (authenticateUser as jest.Mock).mockResolvedValue(mockUser);
    (createUserSession as jest.Mock).mockResolvedValue({
      sessionToken: 'session-token-123',
    });
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/login'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Login successful');
    expect(data.user.email).toBe('user@example.com');
    expect(data.sessionToken).toBe('session-token-123');
    expect(authenticateUser).toHaveBeenCalledWith(
      'user@example.com',
      'password123'
    );
  });

  it('should fail with invalid credentials', async () => {
    (authenticateUser as jest.Mock).mockResolvedValue(null);
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/login'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'wrongpassword',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN',
        status: 'failed',
      })
    );
  });

  it('should fail with missing credentials', async () => {
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/login'),
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

  it('should log audit event on successful login', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (authenticateUser as jest.Mock).mockResolvedValue(mockUser);
    (createUserSession as jest.Mock).mockResolvedValue({
      sessionToken: 'session-token-123',
    });
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/login'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
          deviceName: 'iPhone',
        }),
      }
    );

    await POST(req);

    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'LOGIN',
        status: 'success',
      })
    );
  });

  it('should create session with device name', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (authenticateUser as jest.Mock).mockResolvedValue(mockUser);
    (createUserSession as jest.Mock).mockResolvedValue({
      sessionToken: 'session-token-123',
    });
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/user/login'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
          deviceName: 'Samsung Galaxy',
        }),
      }
    );

    await POST(req);

    expect(createUserSession).toHaveBeenCalledWith(
      'user-1',
      '192.168.1.1',
      'Mozilla/5.0',
      'Samsung Galaxy'
    );
  });
});
