// app/api/admin/enquiries/[id]/next-action/route.ts
// GET    — fetch current next action
// PUT    — set / update next action (STAFF+)
// DELETE — mark next action as done (STAFF+)

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { NextActionType } from '@/types/staff';

const VALID_ACTIONS: NextActionType[] = [
  'CALL_CUSTOMER', 'SEND_QUOTATION', 'FOLLOW_UP',
  'COLLECT_ADVANCE', 'CONFIRM_EVENT', 'COLLECT_BALANCE', 'OTHER',
];

/* ── GET ─────────────────────────────────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('enquiries')
    .select('next_action, next_action_date, next_action_notes, next_action_done, next_action_done_at, assigned_to')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── PUT — set/update next action ───────────────────────────────────────── */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { next_action, next_action_date, next_action_notes, assigned_to } = body as {
    next_action?: NextActionType | null;
    next_action_date?: string | null;
    next_action_notes?: string | null;
    assigned_to?: string | null;
  };

  if (next_action && !VALID_ACTIONS.includes(next_action)) {
    return NextResponse.json(
      { error: `Invalid next_action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Fetch current for audit diff
  const { data: current } = await supabase
    .from('enquiries')
    .select('next_action, next_action_date, next_action_notes, next_action_done, assigned_to, name')
    .eq('id', id)
    .single();

  if (!current) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (next_action !== undefined)       patch.next_action       = next_action;
  if (next_action_date !== undefined)  patch.next_action_date  = next_action_date;
  if (next_action_notes !== undefined) patch.next_action_notes = next_action_notes;
  if (assigned_to !== undefined)       patch.assigned_to       = assigned_to;

  // Reset done flag if action changes
  if (next_action && next_action !== current.next_action) {
    patch.next_action_done    = false;
    patch.next_action_done_at = null;
    patch.next_action_done_by = null;
  }

  const { data, error } = await supabase
    .from('enquiries')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Determine audit action
  const isNew = !current.next_action && next_action;
  const auditAction = isNew ? 'NEXT_ACTION_CREATED' : 'NEXT_ACTION_UPDATED';

  await supabase.from('audit_logs').insert({
    user_id:    auth.user.id,
    action:     auditAction,
    table_name: 'enquiries',
    record_id:  id,
    old_data:   {
      next_action: current.next_action,
      next_action_date: current.next_action_date,
    },
    new_data: { next_action, next_action_date, next_action_notes },
    metadata: { customer: current.name },
  });

  // If assigned_to changed, log separately
  if (assigned_to !== undefined && assigned_to !== current.assigned_to) {
    await supabase.from('audit_logs').insert({
      user_id:    auth.user.id,
      action:     'ENQUIRY_ASSIGNED',
      table_name: 'enquiries',
      record_id:  id,
      old_data:   { assigned_to: current.assigned_to },
      new_data:   { assigned_to },
      metadata:   { customer: current.name },
    });
  }

  return NextResponse.json(data);
}

/* ── DELETE — mark next action as done ──────────────────────────────────── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from('enquiries')
    .select('next_action, next_action_date, name, next_action_done')
    .eq('id', id)
    .single();

  if (!current) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });

  if (current.next_action_done) {
    return NextResponse.json({ message: 'Already marked as done' }, { status: 200 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('enquiries')
    .update({
      next_action_done:    true,
      next_action_done_at: now,
      next_action_done_by: auth.user.id,
      updated_at:          now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await supabase.from('audit_logs').insert({
    user_id:    auth.user.id,
    action:     'NEXT_ACTION_COMPLETED',
    table_name: 'enquiries',
    record_id:  id,
    old_data:   { next_action: current.next_action, next_action_date: current.next_action_date },
    new_data:   { next_action_done: true, completed_at: now },
    metadata:   { customer: current.name, completed_by: auth.user.email },
  });

  return NextResponse.json({ success: true, data });
}
