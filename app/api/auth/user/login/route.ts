import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createUserSession, logUserAuditEvent } from '@/lib/user-auth';
import { getOrCreateCart } from '@/lib/cart';
import { checkRateLimit, resetRateLimit, getAttemptCount, LOGIN_RATE_LIMIT, LOGIN_IP_RATE_LIMIT, ACCOUNT_LOCKOUT_CONFIG } from '@/lib/rate-limit';

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * POST /api/auth/user/login
 * Authenticate user with email and password
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  try {
    // ── IP-level rate limit ──
    const ipLimit = checkRateLimit(`login:ip:${ip}`, LOGIN_IP_RATE_LIMIT);
    if (!ipLimit.allowed) {
      const retryAfterSec = Math.ceil(ipLimit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.', retryAfter: retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    const { email, password, deviceName } = await req.json();

    // Validate input
    if (!email || !password) {
      await logUserAuditEvent({
        email,
        action: 'LOGIN',
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

    // ── Account-level lockout (per email) ──
    const emailKey = `login:email:${email.toLowerCase()}`;
    const failedAttempts = getAttemptCount(emailKey, ACCOUNT_LOCKOUT_CONFIG.windowMs);
    if (failedAttempts >= ACCOUNT_LOCKOUT_CONFIG.maxAttempts) {
      await logUserAuditEvent({
        email,
        action: 'LOGIN',
        status: 'failed',
        errorMessage: 'Account temporarily locked due to too many failed attempts',
        ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      // Record failed attempt against email
      checkRateLimit(emailKey, ACCOUNT_LOCKOUT_CONFIG);

      await logUserAuditEvent({
        email,
        action: 'LOGIN',
        status: 'failed',
        errorMessage: 'Invalid credentials',
        ip,
        userAgent,
      });

      const attemptsLeft = ACCOUNT_LOCKOUT_CONFIG.maxAttempts - getAttemptCount(emailKey, ACCOUNT_LOCKOUT_CONFIG.windowMs);
      return NextResponse.json(
        { error: 'Invalid email or password', attemptsRemaining: attemptsLeft > 0 ? attemptsLeft : 0 },
        { status: 401 }
      );
    }

    // ── Success: clear rate limit for this email ──
    resetRateLimit(emailKey);

    // Create session
    const session = await createUserSession(
      user.id,
      ip !== 'unknown' ? ip : undefined,
      userAgent,
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
      ip,
      userAgent,
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
      ip,
      userAgent,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
