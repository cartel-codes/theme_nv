import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createUserSession, logUserAuditEvent } from '@/lib/user-auth';
import { getOrCreateCart } from '@/lib/cart';

/**
 * POST /api/auth/user/login
 * Authenticate user with email and password
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, deviceName } = await req.json();

    // Validate input
    if (!email || !password) {
      await logUserAuditEvent({
        email,
        action: 'LOGIN',
        status: 'failed',
        errorMessage: 'Missing email or password',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      await logUserAuditEvent({
        email,
        action: 'LOGIN',
        status: 'failed',
        errorMessage: 'Invalid credentials',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createUserSession(
      user.id,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      req.headers.get('user-agent') || undefined,
      deviceName
    );

    // Trigger cart merge (Guest -> User)
    await getOrCreateCart(user.id);

    // Log successful login
    await logUserAuditEvent({
      userId: user.id,
      email: user.email,
      action: 'LOGIN',
      status: 'success',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        deviceName: deviceName || 'unknown',
      },
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        sessionToken: session.sessionToken,
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set({
      name: 'userSession',
      value: session.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    await logUserAuditEvent({
      action: 'LOGIN',
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
