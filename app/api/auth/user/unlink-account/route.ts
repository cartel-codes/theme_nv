import { getUserSession } from '@/lib/user-auth';
import { unlinkOAuthAccount } from '@/lib/oauth';
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

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: 'Missing provider' },
        { status: 400 }
      );
    }

    if (!['google', 'twitter', 'facebook'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const result = await unlinkOAuthAccount(session.userId, provider);

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
    console.error('Account unlinking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unlink account' },
      { status: 500 }
    );
  }
}
