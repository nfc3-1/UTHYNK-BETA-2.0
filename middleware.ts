import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/leaderboard',
  '/challenge',
  '/debate',
  '/enterprise',
  '/stats',
  '/store',
  '/studio',
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function hasUsableSessionCookie(request: NextRequest) {
  const value = request.cookies.get('uthynk-session')?.value;

  return Boolean(
    value && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{32,}$/.test(value)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const forceLogin = request.nextUrl.searchParams.get('force') === '1';
  const hasSession = hasUsableSessionCookie(request);

  if (pathname === '/login' && hasSession && !forceLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isProtectedRoute(pathname) || hasSession) {
    const response = NextResponse.next();

    if (pathname.startsWith('/studio')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    return response;
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/leaderboard/:path*',
    '/challenge/:path*',
    '/debate/:path*',
    '/enterprise/:path*',
    '/stats/:path*',
    '/store/:path*',
    '/studio/:path*',
    '/login',
  ],
};
