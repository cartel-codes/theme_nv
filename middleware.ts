import { NextRequest, NextResponse } from 'next/server';

// UUID v4 format (session token from DB)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  // Allow login and signup pages without authentication
  if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/signup') {
    const response = NextResponse.next();
    response.headers.set('x-pathname', req.nextUrl.pathname);
    return response;
  }

  // Check for valid session cookie (UUID format - DB-backed session token)
  const sessionToken = req.cookies.get('admin_session')?.value;

  if (!sessionToken || !UUID_REGEX.test(sessionToken)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', req.nextUrl.pathname);
  return response;
}
