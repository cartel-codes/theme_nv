import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/user-auth';

/**
 * POST /api/auth/user/verify-email
 * Verify email address using token from email link
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Email verified successfully! You can now access all features.',
      email: result.email,
    });
  } catch (error) {
    console.error('Verify email error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
