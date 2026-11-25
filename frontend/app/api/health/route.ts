// app/api/health/route.ts — Liveness probe for the hosting platform (Render's
// healthCheckPath). Deliberately touches nothing external (no Supabase call),
// so a database hiccup doesn't make Render restart a healthy container.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
