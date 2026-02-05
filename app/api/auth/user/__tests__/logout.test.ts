import { POST, DELETE } from '@/app/api/auth/user/logout/route';
import { NextRequest } from 'next/server';
import {
  invalidateUserSession,
  logUserAuditEvent,
  getUserSession,
  invalidateAllUserSessions,
} from '@/lib/user-auth';

jest.mock('@/lib/user-auth');

// Helper function to create a mocked request with cookies
function createMockRequest(method: string = 'POST', sessionToken: string | null = 'session-token-123') {
  const url = new URL('http://localhost:3000/api/auth/user/logout');
  const req = new NextRequest(url, {
    method,
  });

  // Mock the cookies object
  const mockCookies = {
    get: jest.fn((name: string) => {
      if (name === 'userSession' && sessionToken) {
        return { value: sessionToken };
      }
      return undefined;
    }),
    delete: jest.fn(),
    set: jest.fn(),
  };

  Object.defineProperty(req, 'cookies', {
    value: mockCookies,
    writable: true,
  });

  return req;
}

describe('POST /api/auth/user/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout successfully', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'session-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(),
      deviceName: null,
    };

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    (invalidateUserSession as jest.Mock).mockResolvedValue({});
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('POST', 'session-token-123');
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Logout successful');
    expect(invalidateUserSession).toHaveBeenCalledWith('session-token-123');
    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'LOGOUT',
        status: 'success',
      })
    );
  });

  it('should handle logout without active session', async () => {
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('POST', null);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No active session');
  });

  it('should log audit event on logout', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'session-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(),
      deviceName: null,
    };

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    (invalidateUserSession as jest.Mock).mockResolvedValue({});
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('POST', 'session-token-123');
    await POST(req);

    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'user@example.com',
        action: 'LOGOUT',
        status: 'success',
      })
    );
  });

  it('should clear session cookie on logout', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'session-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(),
      deviceName: null,
    };

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    (invalidateUserSession as jest.Mock).mockResolvedValue({});
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('POST', 'session-token-123');
    const response = await POST(req);

    expect(response.cookies.get('userSession')).toBeUndefined();
  });
});

describe('DELETE /api/auth/user/logout (logout all)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout from all devices', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'session-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(),
      deviceName: null,
    };

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    (invalidateAllUserSessions as jest.Mock).mockResolvedValue({
      count: 3,
    });
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('DELETE', 'session-token-123');
    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Logged out from all devices');
    expect(invalidateAllUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('should log logout all action', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'session-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(),
      deviceName: null,
    };

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    (invalidateAllUserSessions as jest.Mock).mockResolvedValue({
      count: 3,
    });
    (logUserAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest('DELETE', 'session-token-123');
    await DELETE(req);

    expect(logUserAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'LOGOUT_ALL',
        status: 'success',
      })
    );
  });
});
