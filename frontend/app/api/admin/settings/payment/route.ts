// app/api/admin/settings/payment/route.ts
// H69: Persist the hotel's payment details (UPI + bank). OWNER/ADMIN only.
// Writes to the hotels row (migration 025) and records an audit event.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paymentSettingsSchema = z.object({
  upi_id: z.string().trim().max(80).optional().or(z.literal('')),
  bank_name: z.string().trim().max(120).optional().or(z.literal('')),
  bank_account_name: z.string().trim().max(120).optional().or(z.literal('')),
  bank_account_number: z.string().trim().max(40).optional().or(z.literal('')),
  bank_ifsc: z.string().trim().max(20).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const raw = await req.json();
  const parsed = paymentSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!details[key]) details[key] = issue.message;
    }
    return NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
  }

  const supabase = createAdminClient();

  // Find the active hotel record (there is one).
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!hotel) {
    return NextResponse.json({ error: 'No active hotel record found' }, { status: 404 });
  }

  const payload = {
    upi_id: parsed.data.upi_id || null,
    bank_name: parsed.data.bank_name || null,
    bank_account_name: parsed.data.bank_account_name || null,
    bank_account_number: parsed.data.bank_account_number || null,
    bank_ifsc: parsed.data.bank_ifsc || null,
  };

  const { error } = await supabase
    .from('hotels')
    .update(payload)
    .eq('id', hotel.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit — redact the account number in the stored audit trail.
  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'SETTINGS_UPDATED',
    table_name: 'hotels',
    record_id: hotel.id,
    new_data: { ...payload, bank_account_number: payload.bank_account_number ? '***' : null },
    metadata: { scope: 'payment' },
  });

  return NextResponse.json({ success: true });
}
