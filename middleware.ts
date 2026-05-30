import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/leaderboard',
  '/category',
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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('uthynk-session')?.value);
  const hasProfile = Boolean(request.cookies.get('uthynk-profile')?.value);

  if (pathname === '/login' && (hasSession || hasProfile)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isProtectedRoute(pathname) || hasSession || hasProfile) {
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
    '/category/:path*',
    '/challenge/:path*',
    '/daily/:path*',
    '/debate/:path*',
    '/enterprise/:path*',
    '/stats/:path*',
    '/store/:path*',
    '/login',
  ],
};
