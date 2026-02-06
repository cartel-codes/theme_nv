import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetToken, logUserAuditEvent } from '@/lib/user-auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * POST /api/auth/user/forgot-password
 * Request password reset email
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  try {
    // Rate limit: 3 reset requests per hour per IP
    const rateCheck = checkRateLimit(`forgot-password:${ip}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate token (function handles non-existent emails securely)
    const result = await generatePasswordResetToken(email.toLowerCase().trim());

    if (result.success && result.token) {
      // Send reset email (don't await — fire and forget)
      sendPasswordResetEmail(email, result.token).catch((err) => {
        console.error('Failed to send password reset email:', err);
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
