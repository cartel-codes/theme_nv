import { NextRequest, NextResponse } from 'next/server';

// UUID v4 format (session token from DB)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Admin Protection
  if (pathname.startsWith('/admin')) {
    // Allow login and signup pages without authentication
    if (pathname === '/admin/login' || pathname === '/admin/signup') {
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return response;
    }

    // Check for valid session cookie (UUID format - DB-backed session token)
    const sessionToken = req.cookies.get('admin_session')?.value;

    if (!sessionToken || !UUID_REGEX.test(sessionToken)) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 2. User Account Protection
  if (pathname.startsWith('/account')) {
    const userSession = req.cookies.get('userSession')?.value;

    if (!userSession) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}
