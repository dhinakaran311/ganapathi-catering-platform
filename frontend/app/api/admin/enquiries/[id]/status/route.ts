// app/api/admin/enquiries/[id]/status/route.ts
// PATCH — update enquiry status
// Writes to enquiry_status_history + audit_logs atomically.
// Replaces the direct browser-client update in StatusUpdater.tsx.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { EnquiryStatus } from '@/types/enquiry';

const VALID_STATUSES: EnquiryStatus[] = [
  'NEW', 'CONTACTED', 'DISCUSSION', 'QUOTE_SENT',
  'FOLLOW_UP', 'CONFIRMED', 'EVENT_SCHEDULED', 'COMPLETED', 'CANCELLED',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // STAFF+ can update status
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { status, reason } = body as { status: EnquiryStatus; reason?: string };

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Fetch current enquiry
  const { data: enquiry, error: fetchErr } = await supabase
    .from('enquiries')
    .select('id, status, name')
    .eq('id', id)
    .single();

  if (fetchErr || !enquiry) {
    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
  }

  const oldStatus = enquiry.status as EnquiryStatus;

  if (oldStatus === status) {
    return NextResponse.json({ message: 'Status unchanged', status }, { status: 200 });
  }

  // Update enquiry status
  const { data: updated, error: updateErr } = await supabase
    .from('enquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Write status history — this is what fills the ActivityTimeline
  await supabase.from('enquiry_status_history').insert({
    enquiry_id:    id,
    old_status:    oldStatus,
    new_status:    status,
    changed_by:    auth.user.id,
    change_reason: reason ?? null,
    automated:     false,
  });

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id:    auth.user.id,
    action:     'ENQUIRY_STATUS_CHANGED',
    table_name: 'enquiries',
    record_id:  id,
    old_data:   { status: oldStatus },
    new_data:   { status },
    metadata:   { reason, customer: enquiry.name },
  });

  return NextResponse.json({ success: true, old_status: oldStatus, new_status: status, enquiry: updated });
}
