// app/api/admin/logout/route.ts — Logout API route

// Redirects back to the login page with a RELATIVE Location header, so the
// browser stays on whatever address it is using. (Building an absolute URL
// from req.url sent users to https://0.0.0.0:10000/admin/login on Render,
// where the server's internal address is not the public one.) 303 See Other
// makes the browser follow up with a GET. The cleared session cookies set by
// signOut() are attached to this response by Next.js.

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return new NextResponse(null, {
    status: 303,
    headers: { Location: '/admin/login', 'Cache-Control': 'no-store' },
  });
}
