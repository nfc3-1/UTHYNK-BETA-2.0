import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/leaderboard',
  '/challenge',
  '/daily',
  '/debate',
  '/enterprise',
  '/stats',
  '/store',
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
    return NextResponse.next();
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
    '/daily/:path*',
    '/debate/:path*',
    '/enterprise/:path*',
    '/stats/:path*',
    '/store/:path*',
    '/login',
  ],
};
