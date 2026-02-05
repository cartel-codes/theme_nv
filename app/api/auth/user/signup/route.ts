import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createUserSession, logUserAuditEvent } from '@/lib/user-auth';

/**
 * POST /api/auth/user/signup
 * Create a new user account with email and password
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    // Validate input
    if (!email || !password) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
        status: 'failed',
        errorMessage: 'Invalid email format',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
        status: 'failed',
        errorMessage: 'Password too weak',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
        status: 'failed',
        errorMessage: 'User already exists',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser(email, password, firstName, lastName);

    // Create session
    const session = await createUserSession(
      user.id,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      req.headers.get('user-agent') || undefined
    );

    // Log successful signup
    await logUserAuditEvent({
      userId: user.id,
      email: user.email,
      action: 'SIGNUP',
      status: 'success',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        firstName,
        lastName,
      },
    });

    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        sessionToken: session.sessionToken,
      },
      { status: 201 }
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
    console.error('Signup error:', error);

    await logUserAuditEvent({
      action: 'SIGNUP',
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
