import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSession,
  getUserSessions,
  updateUserSessionActivity,
  invalidateUserSession,
  getUserSessionStats,
  logUserAuditEvent,
} from '@/lib/user-auth';

/**
 * GET /api/user/sessions
 * Get all active sessions for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session exists and is valid
    const session = await getUserSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Update activity
    await updateUserSessionActivity(sessionToken);

    // Get all user sessions
    const sessions = await getUserSessions(session.userId);
    const stats = await getUserSessionStats(session.userId);

    return NextResponse.json({
      sessions,
      stats,
    });
  } catch (error) {
    console.error('Get sessions error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/sessions/:sessionId
 * Invalidate a specific session
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session exists
    const session = await getUserSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get the session ID from query params or body
    const { searchParams } = new URL(req.url);
    const targetSessionId = searchParams.get('id') || (await req.json()).sessionId;

    if (!targetSessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get target session to verify it belongs to the user
    const targetSession = await getUserSession(targetSessionId);
    if (!targetSession || targetSession.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Invalidate the target session
    await invalidateUserSession(targetSessionId);

    // Log the action
    await logUserAuditEvent({
      userId: session.userId,
      email: session.user.email,
      action: 'LOGOUT_SESSION',
      status: 'success',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        sessionId: targetSessionId,
      },
    });

    return NextResponse.json({
      message: 'Session invalidated',
    });
  } catch (error) {
    console.error('Delete session error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
