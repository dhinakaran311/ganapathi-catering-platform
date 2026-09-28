import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

// next-intl proxy for locale routing
const intlProxy = createMiddleware(routing);

// Named proxy function (Next.js 16 convention)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes — protect with auth cookie check
  if (pathname.startsWith('/admin')) {
    // Let the login page through
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for Supabase auth cookie (sb-<project>-auth-token)
    const authCookies = request.cookies.getAll().filter(
      (cookie) => cookie.name.includes('-auth-token') || cookie.name.startsWith('sb-')
    );

    if (authCookies.length === 0) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // For all other matched routes — run next-intl proxy
  return intlProxy(request);
}

export const config = {
  // Match internationalized pathnames + admin routes
  matcher: [
    '/',
    '/(ta|en)/:path*',
    '/admin/:path*',
  ],
};
