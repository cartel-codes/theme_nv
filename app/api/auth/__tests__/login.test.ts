import { POST } from '../login/route';
import { NextRequest } from 'next/server';
import { authenticateAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';

jest.mock('@/lib/auth');
jest.mock('@/lib/session');
jest.mock('@/lib/audit');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@novraux.com',
      name: 'Admin User',
      role: 'admin',
    };

    (authenticateAdminUser as jest.Mock).mockResolvedValue(mockUser);
    (createSession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/login'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          password: 'admin123!',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(authenticateAdminUser).toHaveBeenCalledWith('admin@novraux.com', 'admin123!');
    expect(createSession).toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_SUCCESS',
        status: 'success',
        email: 'admin@novraux.com',
      })
    );
  });

  it('should fail with invalid credentials', async () => {
    (authenticateAdminUser as jest.Mock).mockResolvedValue(null);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/login'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          password: 'wrongpassword',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid');
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_FAILED',
        status: 'failed',
      })
    );
  });

  it('should fail with missing credentials', async () => {
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/login'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          // missing password
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should log audit event on success', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@novraux.com',
      username: 'Admin User',
      role: 'admin',
    };

    (authenticateAdminUser as jest.Mock).mockResolvedValue(mockUser);
    (createSession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/login'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          password: 'admin123!',
        }),
      }
    );

    await POST(req);

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        email: 'admin@novraux.com',
        action: 'LOGIN_SUCCESS',
        status: 'success',
        metadata: expect.objectContaining({
          userName: 'Admin User',
          userRole: 'admin',
        }),
      })
    );
  });
});
