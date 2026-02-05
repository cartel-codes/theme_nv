import { POST } from '../logout/route';
import { NextRequest } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';

jest.mock('@/lib/session');
jest.mock('@/lib/audit');

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout successfully', async () => {
    const mockSession = {
      id: 'user-123',
      email: 'admin@novraux.com',
      name: 'Admin User',
      role: 'admin',
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (destroySession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/logout'),
      {
        method: 'POST',
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(destroySession).toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGOUT',
        status: 'success',
        userId: 'user-123',
        email: 'admin@novraux.com',
      })
    );
  });

  it('should handle logout without active session', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    (destroySession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/logout'),
      {
        method: 'POST',
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(destroySession).toHaveBeenCalled();
  });

  it('should log audit event on logout', async () => {
    const mockSession = {
      id: 'user-123',
      email: 'admin@novraux.com',
      name: 'Admin User',
      role: 'admin',
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (destroySession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/logout'),
      {
        method: 'POST',
      }
    );

    await POST(req);

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        email: 'admin@novraux.com',
        action: 'LOGOUT',
        status: 'success',
      })
    );
  });

  it('should handle errors gracefully', async () => {
    (getSession as jest.Mock).mockRejectedValue(new Error('Session error'));
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/logout'),
      {
        method: 'POST',
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGOUT',
        status: 'failed',
      })
    );
  });
});
