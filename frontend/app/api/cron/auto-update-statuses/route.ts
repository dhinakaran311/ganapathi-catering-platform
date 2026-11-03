// app/api/cron/auto-update-statuses/route.ts
// E38: Auto-cancel stale enquiries.
//
// Runs daily via Vercel Cron (see vercel.json). Any enquiry still in NEW
// status after STALE_DAYS with no staff response is cancelled automatically,
// with the reason recorded and the transition written to
// enquiry_status_history (automated=true) so the ActivityTimeline shows it.
//
// Security: Vercel Cron sends an `Authorization: Bearer ${CRON_SECRET}`
// header on scheduled invocations. We verify that token and reject any
// unauthenticated call, so this route cannot be abused to mass-cancel
// enquiries. If CRON_SECRET is unset we fail closed (reject everything).

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Enquiries in NEW status older than this many days are auto-cancelled.
const STALE_DAYS = 30;

export async function POST(req: NextRequest) {
  // ── Auth: only the scheduler (or an operator with the secret) may call ──
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed — never run the bulk mutation without a configured secret.
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();

  // Fetch stale NEW enquiries (no confirmed order, no response yet).
  const { data: stale, error: fetchErr } = await supabase
    .from('enquiries')
    .select('id, name, status, created_at')
    .eq('status', 'NEW')
    .lt('created_at', cutoff);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!stale || stale.length === 0) {
    return NextResponse.json({ success: true, cancelled: 0, message: 'Nothing to cancel' });
  }

  const reason = `Auto-cancelled: no response within ${STALE_DAYS} days`;
  let cancelled = 0;

  for (const enquiry of stale) {
    const { error: updateErr } = await supabase
      .from('enquiries')
      .update({
        status: 'CANCELLED',
        auto_cancelled_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enquiry.id)
      .eq('status', 'NEW'); // guard: only cancel if still NEW (idempotent under concurrency)

    if (updateErr) {
      console.error(`[cron] Failed to cancel enquiry ${enquiry.id}:`, updateErr.message);
      continue;
    }

    // Record the automated transition for the ActivityTimeline.
    await supabase.from('enquiry_status_history').insert({
      enquiry_id:    enquiry.id,
      old_status:    'NEW',
      new_status:    'CANCELLED',
      changed_by:    null,
      change_reason: reason,
      automated:     true,
    });

    cancelled += 1;
  }

  return NextResponse.json({ success: true, cancelled, staleDays: STALE_DAYS });
}

// Vercel Cron uses GET or POST depending on config; accept both.
export { POST as GET };
