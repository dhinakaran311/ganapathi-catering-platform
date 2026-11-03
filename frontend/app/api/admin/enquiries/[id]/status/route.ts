// app/api/admin/enquiries/[id]/status/route.ts
// PATCH — update enquiry status
// Writes to enquiry_status_history + audit_logs atomically.
// Replaces the direct browser-client update in StatusUpdater.tsx.

//
// Permissions: STAFF+ may move an enquiry through the pipeline. Marking an
// enquiry COMPLETED, or re-opening a COMPLETED / CANCELLED one, is an
// OWNER/ADMIN action — the same level required by the Complete Order flow.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { EnquiryStatus } from '@/types/enquiry';
import { enquiryStatusUpdateSchema, zodFieldErrors } from '@/lib/validation';

const FINAL_STATUSES: EnquiryStatus[] = ['COMPLETED', 'CANCELLED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // STAFF+ can update status
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = enquiryStatusUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid status update', details: zodFieldErrors(parsed.error) },
      { status: 422 }
    );
  }
  const status = parsed.data.status as EnquiryStatus;
  const reason = parsed.data.reason ?? undefined;
  const isAdmin = auth.role === 'OWNER' || auth.role === 'ADMIN';

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

  if (!isAdmin && (status === 'COMPLETED' || FINAL_STATUSES.includes(oldStatus))) {
    return NextResponse.json(
      {
        error: status === 'COMPLETED'
          ? 'Only an Owner or Admin can mark an order Completed (use “Complete Order”).'
          : 'Only an Owner or Admin can re-open a completed or cancelled enquiry.',
      },
      { status: 403 }
    );
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
