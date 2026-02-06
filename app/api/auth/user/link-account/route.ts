import { getUserSession } from '@/lib/user-auth';
import { handleOAuthCallback } from '@/lib/oauth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getUserSession(sessionToken);

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { provider, code } = await request.json();

    if (!provider || !code) {
      return NextResponse.json(
        { error: 'Missing provider or code' },
        { status: 400 }
      );
    }

    if (!['google', 'twitter', 'facebook'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/${provider}`;

    const result = await handleOAuthCallback(
      provider,
      code,
      redirectUri,
      session.userId  // Link to current user
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Account linking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to link account' },
      { status: 500 }
    );
  }
}
