// lib/supabase/public.ts — anonymous, cookie-free client for PUBLIC pages.
//
// Public pages (home reviews, service areas, gallery) only read data that
// RLS already exposes to everyone (migration 011: approved reviews, active
// service areas, active gallery photos). They must NOT use the cookie-bound
// client in ./server.ts: that one picks up a visitor's admin login cookie
// and, when that session is stale, tries to refresh it on every page view
// ("AuthApiError: Invalid Refresh Token: Refresh Token Not Found"). It would
// also make the public site show an admin whatever their role can see,
// instead of exactly what customers see.

import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function createPublicClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
  }
  return client;
}
