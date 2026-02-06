import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createUserSession, logUserAuditEvent, generateEmailVerificationToken } from '@/lib/user-auth';
import { checkRateLimit, SIGNUP_RATE_LIMIT } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/password-validation';
import { sendVerificationEmail } from '@/lib/email';

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * POST /api/auth/user/signup
 * Create a new user account with email and password
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  try {
    // ── IP-level rate limit ──
    const ipLimit = checkRateLimit(`signup:ip:${ip}`, SIGNUP_RATE_LIMIT);
    if (!ipLimit.allowed) {
      const retryAfterSec = Math.ceil(ipLimit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.', retryAfter: retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    const { email, password, firstName, lastName } = await req.json();

    // Validate input
    if (!email || !password) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
        status: 'failed',
        errorMessage: 'Missing email or password',
        ip,
        userAgent,
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
        ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ── Password strength validation ──
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      await logUserAuditEvent({
        email,
        action: 'SIGNUP',
        status: 'failed',
        errorMessage: 'Password too weak',
        ip,
        userAgent,
      });

      return NextResponse.json(
        { error: passwordCheck.errors[0], errors: passwordCheck.errors },
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
        ip,
        userAgent,
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
      ip !== 'unknown' ? ip : undefined,
      userAgent
    );

    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(user.id);

    // Send verification email (async, don't block response)
    sendVerificationEmail(user.email, user.firstName, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    // Log successful signup
    await logUserAuditEvent({
      userId: user.id,
      email: user.email,
      action: 'SIGNUP',
      status: 'success',
      ip,
      userAgent,
      metadata: {
        firstName,
        lastName,
        emailVerificationSent: true,
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
          emailVerified: false,
        },
        sessionToken: session.sessionToken,
        notice: 'Please check your email to verify your account.',
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
      ip,
      userAgent,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
