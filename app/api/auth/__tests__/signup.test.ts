import { POST } from '../signup/route';
import { NextRequest } from 'next/server';
import { createAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth');
jest.mock('@/lib/session');
jest.mock('@/lib/audit');
jest.mock('@/lib/prisma');

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create account successfully with valid data', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'newadmin@novraux.com',
      name: 'New Admin',
      role: 'admin',
    };

    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);
    (createAdminUser as jest.Mock).mockResolvedValue(mockUser);
    (createSession as jest.Mock).mockResolvedValue(undefined);
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/signup'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'newadmin@novraux.com',
          password: 'securePass123!',
          name: 'New Admin',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(createAdminUser).toHaveBeenCalledWith(
      'newadmin@novraux.com',
      'securePass123!',
      'New Admin'
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SIGNUP_SUCCESS',
        status: 'success',
      })
    );
  });

  it('should reject if user already exists', async () => {
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'admin@novraux.com',
    });
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/signup'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          password: 'securePass123!',
          name: 'Admin',
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already exists');
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SIGNUP_FAILED',
        status: 'failed',
        errorMessage: 'User already exists',
      })
    );
  });

  it('should fail with missing email or password', async () => {
    (logAuditEvent as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/signup'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'newadmin@novraux.com',
          // missing password
        }),
      }
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });
});
