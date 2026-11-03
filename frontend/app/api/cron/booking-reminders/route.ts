// app/api/cron/booking-reminders/route.ts
// B17: Booking reminder scheduler.
//
// Runs daily via Vercel Cron (see vercel.json). For every CONFIRMED /
// EVENT_SCHEDULED enquiry with a future event_date, it idempotently creates
// reminder rows (7, 3 and 1 day before the event) that don't already exist.
// The admin Upcoming Events widget / dashboard surfaces reminders that are due.
//
// Note on delivery: outbound WhatsApp auto-messaging needs the WhatsApp
// Business API, which is out of scope for this MVP (see plan). So this job
// only materialises the reminder rows; staff act on them from the dashboard.
//
// Security: same CRON_SECRET bearer-token check as the auto-status job —
// fails closed if the secret is unset, rejects unauthenticated calls.

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const REMINDER_OFFSETS: { type: string; days: number }[] = [
  { type: '7_days_before', days: 7 },
  { type: '3_days_before', days: 3 },
  { type: '1_day_before',  days: 1 },
];

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Confirmed/scheduled enquiries with a known, upcoming event date.
  const { data: events, error: fetchErr } = await supabase
    .from('enquiries')
    .select('id, event_date, status')
    .in('status', ['CONFIRMED', 'EVENT_SCHEDULED'])
    .not('event_date', 'is', null)
    .gte('event_date', now);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ success: true, created: 0, message: 'No upcoming confirmed events' });
  }

  let created = 0;

  for (const ev of events) {
    // Fetch existing reminders for this enquiry to stay idempotent.
    const { data: existing } = await supabase
      .from('booking_reminders')
      .select('reminder_type')
      .eq('enquiry_id', ev.id);

    const existingTypes = new Set((existing ?? []).map((r) => r.reminder_type));

    const eventTs = new Date(ev.event_date + 'T00:00:00').getTime();

    const rows = REMINDER_OFFSETS.filter((o) => !existingTypes.has(o.type))
      .map((o) => ({
        enquiry_id:     ev.id,
        reminder_type:  o.type,
        scheduled_for:  new Date(eventTs - o.days * 86_400_000).toISOString(),
        status:         'pending',
        delivery_method: 'whatsapp',
      }));

    if (rows.length === 0) continue;

    const { error: insertErr } = await supabase
      .from('booking_reminders')
      .insert(rows);

    if (insertErr) {
      console.error(`[cron] booking reminders insert failed for enquiry ${ev.id}:`, insertErr.message);
      continue;
    }

    created += rows.length;
  }

  return NextResponse.json({ success: true, created, events: events.length });
}

export { POST as GET };
