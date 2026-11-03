// app/api/admin/logout/route.ts — Logout API route

// Redirects back to the login page on THIS site's origin (taken from the
// incoming request), never the Supabase project URL. 303 See Other makes the
// browser follow up with a GET, so the login page isn't re-requested as POST.

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/admin/login', req.url), 303);
}
