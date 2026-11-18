// app/api/cron/auto-update-statuses/route.ts
// E38: Auto-cancel stale enquiries.
//
// Runs daily via Vercel Cron (see vercel.json). An enquiry still in NEW
// status (no staff response) is cancelled automatically when:
//   • its event date has already passed (IST), or
//   • it has NO event date and is older than STALE_DAYS.
// An enquiry for a FUTURE event is never auto-cancelled, however old — a
// customer may enquire months ahead. The reason is recorded and the
// transition written to enquiry_status_history (automated=true) so the
// ActivityTimeline shows it.
//
// Security: Vercel Cron sends an `Authorization: Bearer ${CRON_SECRET}`
// header on scheduled invocations. We verify that token and reject any
// unauthenticated call, so this route cannot be abused to mass-cancel
// enquiries. If CRON_SECRET is unset we fail closed (reject everything).

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { todayInIST } from '@/lib/datetime';

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
  const today = todayInIST();

  // Candidates: NEW enquiries that are either old or whose event has passed.
  const { data: candidates, error: fetchErr } = await supabase
    .from('enquiries')
    .select('id, name, status, created_at, event_date')
    .eq('status', 'NEW')
    .or(`created_at.lt.${cutoff},event_date.lt.${today}`);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  // Apply the rule precisely (never cancel an enquiry for a future event).
  const stale = (candidates ?? [])
    .map((e) => {
      if (e.event_date && e.event_date < today) {
        return { ...e, reason: 'Auto-cancelled: event date passed with no response' };
      }
      if (!e.event_date && e.created_at < cutoff) {
        return { ...e, reason: `Auto-cancelled: no response within ${STALE_DAYS} days` };
      }
      return null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (stale.length === 0) {
    return NextResponse.json({ success: true, cancelled: 0, message: 'Nothing to cancel' });
  }

  let cancelled = 0;

  for (const enquiry of stale) {
    const reason = enquiry.reason;
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
