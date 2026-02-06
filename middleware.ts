import { NextRequest, NextResponse } from 'next/server';

// UUID v4 format (session token from DB)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Hex session token format (user sessions use 32 random hex bytes = 64 chars)
const HEX_TOKEN_REGEX = /^[0-9a-f]{64}$/i;

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Admin Routes ───────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Allow login and signup pages without authentication
    if (pathname === '/admin/login' || pathname === '/admin/signup') {
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return response;
    }

    // Check for valid admin session cookie (UUID format - DB-backed session token)
    const sessionToken = req.cookies.get('admin_session')?.value;

    if (!sessionToken || !UUID_REGEX.test(sessionToken)) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // ─── User Account Routes ───────────────────────────────────
  if (pathname.startsWith('/account')) {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken || !HEX_TOKEN_REGEX.test(sessionToken)) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // ─── Checkout Route ─────────────────────────────────────────
  if (pathname.startsWith('/checkout')) {
    // Allow the main checkout page (it handles auth check client-side)
    // but protect success page
    if (pathname === '/checkout/success') {
      const sessionToken = req.cookies.get('userSession')?.value;

      if (!sessionToken || !HEX_TOKEN_REGEX.test(sessionToken)) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('redirect', '/checkout');
        return NextResponse.redirect(loginUrl);
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  return NextResponse.next();
}
