// proxy.ts — Next.js 16 routing proxy
// Handles three concerns:
//   1. Supabase session refresh on admin requests
//   2. Admin route protection (redirect to login if unauthenticated or if
//      2FA is enrolled but not yet completed in this session)
//   3. next-intl locale routing for public pages

import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { getMfaStatus } from './lib/auth/mfa';

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

    // 2FA: a signed-in user with an enrolled authenticator must finish the
    // TOTP step (aal2) before any admin page. The login page hosts that step.
    const mfaSatisfied = user ? (await getMfaStatus(supabase, user)).satisfied : false;

    // Not signed in, or 2FA pending → login page (which shows the TOTP step).
    if (!isLoginRoute && (!user || !mfaSatisfied)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      if (user && !mfaSatisfied) loginUrl.searchParams.set('mfa', '1');
      return NextResponse.redirect(loginUrl);
    }

    // Fully authenticated users don't need the login page.
    if (isLoginRoute && user && mfaSatisfied) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return response;
  }

  // ── Public locale routing (next-intl) ─────────────────────────────────────
  return intlProxy(request);
}

// Run the proxy on pages only. Excluded:
//   • /api/*      — route handlers do their own auth (requireMinRole / CRON_SECRET).
//                   Letting next-intl see them redirected every API call to
//                   /ta/api/... (404), silently dropping enquiries, reviews,
//                   cron jobs and all admin mutations.
//   • /_next/*, /_vercel/* — framework internals
//   • any path containing a dot — static files (images, icon.png, robots.txt,
//                   sitemap.xml, manifest, etc.)
// /admin/* pages and all public locale pages still match.
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
