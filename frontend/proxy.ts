// proxy.ts — Next.js 16 routing proxy
// Handles two concerns:
//   1. Supabase session refresh on every request
//   2. Admin route protection (redirect to login if unauthenticated)
//   3. next-intl locale routing for public pages

import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

// next-intl proxy for locale routing
const intlProxy = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route handling ───────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isLoginRoute = pathname.startsWith('/admin/login');

    // Refresh Supabase session and get user
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Redirect unauthenticated users to login
    if (!isLoginRoute && !user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login
    if (isLoginRoute && user) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return response;
  }

  // ── Public locale routing (next-intl) ─────────────────────────────────────
  return intlProxy(request);
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    // Internationalized public routes
    '/',
    '/(ta|en)/:path*',
    // Exclude static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
