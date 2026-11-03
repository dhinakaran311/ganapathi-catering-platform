// app/api/track/route.ts — A9: Analytics beacon endpoint (public).
//
// Replaces the old direct browser → Supabase insert (which needed an anon
// INSERT policy on analytics_events, removed in migration 027). Events are
// validated against an allow-list and rate-limited per IP, then written with
// the service role. Always answers 204 so analytics can never break the UI.

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { trackSchema } from '@/lib/validation';
import { getClientIp, hashIdentifier } from '@/lib/security/request';
import { checkRateLimits } from '@/lib/security/rate-limit';

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  try {
    // sendBeacon posts text/plain, so parse the raw body ourselves.
    const raw = await req.text();
    if (raw.length > 4096) return noContent();

    const parsed = trackSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return noContent();

    const allowed = await checkRateLimits([
      { bucket: `track:ip:${hashIdentifier(getClientIp(req))}`, limit: 120, windowSeconds: 600 },
    ]);
    if (!allowed) return noContent();

    const { event, page, metadata } = parsed.data;
    const supabase = createAdminClient();
    const { error } = await supabase.from('analytics_events').insert({
      event_name: event,
      page_path: page ?? '',
      metadata: metadata ?? {},
    });
    if (error) console.warn('[track] insert failed:', error.message);
  } catch {
    // malformed body / DB down — analytics is best-effort
  }
  return noContent();
}
