import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, updateUserSessionActivity } from '@/lib/user-auth';
import { generateEmailVerificationToken } from '@/lib/user-auth';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/user/resend-verification
 * Resend email verification link
 */
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getUserSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Rate limit: 3 resends per hour per user
    const rateCheck = checkRateLimit(`resend-verification:${user.id}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate new token
    const token = await generateEmailVerificationToken(user.id);

    // Send verification email (don't await)
    sendVerificationEmail(user.email, user.firstName || '', token).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    await updateUserSessionActivity(sessionToken);

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
