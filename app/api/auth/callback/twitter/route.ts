import { handleOAuthCallback } from '@/lib/oauth';
import { createUserSession, getUserSession } from '@/lib/user-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/login?error=Missing authorization code', request.url)
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/twitter`;

    // Check if user is already logged in (account linking scenario)
    const sessionToken = request.cookies.get('userSession')?.value;
    let userId: string | undefined;
    if (sessionToken) {
      const session = await getUserSession(sessionToken);
      userId = session?.userId;
    }

    const result = await handleOAuthCallback('twitter', code, redirectUri, userId);

    if (!result.success || !result.user) {
      const errorPage = userId ? '/account?error=' : '/auth/login?error=';
      return NextResponse.redirect(
        new URL(`${errorPage}${encodeURIComponent(result.error || 'OAuth failed')}`, request.url)
      );
    }

    // If linking, redirect back to account page with success message
    if (userId) {
      return NextResponse.redirect(
        new URL('/account?success=Account linked successfully', request.url)
      );
    }

    // Create session for new sign-in
    const session = await createUserSession(
      result.user.id,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    const response = NextResponse.redirect(new URL('/account', request.url));
    response.cookies.set('userSession', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=OAuth authentication failed', request.url)
    );
  }
}
