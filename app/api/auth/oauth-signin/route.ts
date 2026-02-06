import { getAuthorizationUrl } from '@/lib/oauth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as any;

    if (!provider || !['google', 'twitter', 'facebook'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/${provider}`;
    const authUrl = getAuthorizationUrl(provider, redirectUri);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
