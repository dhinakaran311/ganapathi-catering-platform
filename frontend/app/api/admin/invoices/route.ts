import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole, requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';

/* ── audit helper ── */
async function writeAudit(opts: {
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
  action: string;
  recordId: string;
  oldData?: object | null;
  newData?: object | null;
}) {
  await opts.supabase.from('audit_logs').insert({
    user_id:    opts.userId,
    action:     opts.action,
    table_name: 'invoices',
    record_id:  opts.recordId,
    old_data:   opts.oldData ?? null,
    new_data:   opts.newData ?? null,
  });
}

/* GET  /api/admin/invoices?enquiry_id=xxx  — list invoices (VIEWER+) */
export async function GET(req: NextRequest) {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const enquiryId = req.nextUrl.searchParams.get('enquiry_id');
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (enquiryId) query = query.eq('enquiry_id', enquiryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* POST /api/admin/invoices  — create new invoice (STAFF+) */
export async function POST(req: NextRequest) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const user = auth.user;
  const body = await req.json();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      enquiry_id: body.enquiry_id ?? null,
      customer_id: body.customer_id ?? null,
      subtotal: body.subtotal ?? 0,
      tax_amount: body.tax_amount ?? 0,
      delivery_charge: body.delivery_charge ?? 0,
      discount_amount: body.discount_amount ?? 0,
      total_amount: body.total_amount ?? 0,
      invoice_data: body.invoice_data ?? {},
      status: body.status ?? 'DRAFT',  // canonical uppercase; DB migrated by 014_invoice_status_canonical.sql
      notes: body.notes ?? null,
      invoice_number: '', // DB trigger fills this
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit: INVOICE_CREATED
  await writeAudit({
    supabase,
    userId: user.id,
    action: 'INVOICE_CREATED',
    recordId: data.id,
    newData: data,
  });

  return NextResponse.json(data, { status: 201 });
}

/* PUT /api/admin/invoices  — update full invoice (STAFF+) */
export async function PUT(req: NextRequest) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const user = auth.user;
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Fetch current invoice for audit diff
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('invoices')
    .update(rest)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit: INVOICE_UPDATED
  await writeAudit({
    supabase,
    userId: user.id,
    action: 'INVOICE_UPDATED',
    recordId: id,
    oldData: existing,
    newData: data,
  });

  return NextResponse.json(data);
}

/* PATCH /api/admin/invoices  — partial update; ADMIN+ for cancel (STAFF+ for send) */
export async function PATCH(req: NextRequest) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const user = auth.user;
  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Fetch current invoice for audit diff
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  // Normalise status to uppercase if provided
  if (patch.status) patch.status = (patch.status as string).toUpperCase();

  const { data, error } = await supabase
    .from('invoices')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit: INVOICE_SENT when sent_at is set, else INVOICE_UPDATED
  const auditAction = patch.sent_at ? 'INVOICE_SENT' : 'INVOICE_UPDATED';
  await writeAudit({
    supabase,
    userId: user.id,
    action: auditAction,
    recordId: id,
    oldData: existing,
    newData: data,
  });

  return NextResponse.json(data);
}

/* DELETE /api/admin/invoices?id=xxx — soft delete / cancel (ADMIN+) */
export async function DELETE(req: NextRequest) {
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const user = auth.user;

  const id = req.nextUrl.searchParams.get('id');
  const reason = req.nextUrl.searchParams.get('reason') ?? 'Cancelled by admin';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Fetch current invoice for audit
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Invoice is already cancelled' }, { status: 422 });
  }

  // Soft-delete: mark as CANCELLED and preserve all data
  const { data, error } = await supabase
    .from('invoices')
    .update({
      status: 'CANCELLED',
      is_deleted: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit: INVOICE_CANCELLED
  await writeAudit({
    supabase,
    userId: user.id,
    action: 'INVOICE_CANCELLED',
    recordId: id,
    oldData: invoice,
    newData: data,
  });

  return NextResponse.json({ success: true, data });
}
