import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken, logUserAuditEvent } from '@/lib/user-auth';
import { validatePassword } from '@/lib/password-validation';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * POST /api/auth/user/reset-password
 * Reset password using token from email
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  try {
    // Rate limit: 5 attempts per hour per IP
    const rateCheck = checkRateLimit(`reset-password:${ip}`, {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0], errors: passwordCheck.errors },
        { status: 400 }
      );
    }

    // Reset password
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
