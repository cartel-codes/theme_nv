import { NextRequest, NextResponse } from 'next/server';
import {
  invalidateUserSession,
  logUserAuditEvent,
  getUserSession,
  invalidateAllUserSessions,
} from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/user/logout
 * Logout user by invalidating the session
 */
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Get session info before invalidating
    const session = await getUserSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    // Invalidate session
    await invalidateUserSession(sessionToken);

    // Log logout event
    await logUserAuditEvent({
      userId: session.userId,
      email: session.user.email,
      action: 'LOGOUT',
      status: 'success',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.delete('userSession');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    await logUserAuditEvent({
      action: 'LOGOUT',
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/user/logout-all
 * Logout user from all devices
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Get session info
    const session = await getUserSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    // Invalidate all sessions for the user
    await invalidateAllUserSessions(session.userId);

    // Log logout all event
    await logUserAuditEvent({
      userId: session.userId,
      email: session.user.email,
      action: 'LOGOUT_ALL',
      status: 'success',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.json(
      {
        message: 'Logged out from all devices',
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.delete('userSession');

    return response;
  } catch (error) {
    console.error('Logout all error:', error);

    await logUserAuditEvent({
      action: 'LOGOUT_ALL',
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
