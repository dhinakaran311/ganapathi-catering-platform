import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole, requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import { invoiceCreateSchema, invoiceUpdateSchema, invoicePatchSchema } from '@/lib/validation';

/* ── validation helper ── */
function validationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!details[key]) details[key] = issue.message;
  }
  return NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
}

/* ── invoice state / permission rules (shared by PUT + PATCH) ──────────────
   • CANCELLED invoices are immutable.
   • Only OWNER/ADMIN may change status, except DRAFT → SENT (staff share).
   • Re-sharing a non-draft invoice never downgrades its status to SENT
     (the status change is dropped; sent_at is still recorded).
   • Amounts of a PAID invoice can only be changed by OWNER/ADMIN.
   Mutates `changes` (drops a no-op status) and returns an error response, or
   null when the change is allowed. */
const FINANCIAL_FIELDS = [
  'subtotal', 'tax_amount', 'delivery_charge', 'discount_amount', 'total_amount', 'invoice_data',
] as const;

function enforceInvoiceRules(
  existing: { status: string } | null,
  changes: Record<string, unknown>,
  role: string,
): NextResponse | null {
  if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  if (existing.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cancelled invoices cannot be changed.' }, { status: 422 });
  }

  const nextStatus = changes.status as string | undefined;
  if (nextStatus !== undefined && nextStatus !== existing.status) {
    if (nextStatus === 'SENT') {
      if (existing.status !== 'DRAFT') delete changes.status; // never downgrade
    } else if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only an Owner or Admin can change this invoice’s status.' },
        { status: 403 }
      );
    }
  } else if (nextStatus === existing.status) {
    delete changes.status;
  }

  if (existing.status === 'PAID' && !isAdmin && FINANCIAL_FIELDS.some((f) => f in changes)) {
    return NextResponse.json(
      { error: 'This invoice is fully paid. Only an Owner or Admin can change its amounts.' },
      { status: 403 }
    );
  }

  return null;
}

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
  const raw = await req.json();

  const parsedBody = invoiceCreateSchema.safeParse(raw);
  if (!parsedBody.success) return validationError(parsedBody.error);
  const body = parsedBody.data;

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
  const raw = await req.json();

  const parsedBody = invoiceUpdateSchema.safeParse(raw);
  if (!parsedBody.success) return validationError(parsedBody.error);
  const { id, ...rest } = parsedBody.data;

  // Fetch current invoice for audit diff + state rules
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const denied = enforceInvoiceRules(existing, rest as Record<string, unknown>, auth.role);
  if (denied) return denied;

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

/* PATCH /api/admin/invoices  — partial update; ADMIN+ for status changes (STAFF+ may mark DRAFT → SENT) */
export async function PATCH(req: NextRequest) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const user = auth.user;
  const raw = await req.json();

  const parsedBody = invoicePatchSchema.safeParse(raw);
  if (!parsedBody.success) return validationError(parsedBody.error);
  const { id, ...patch } = parsedBody.data;

  // Fetch current invoice for audit diff + state rules
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Status is validated as an uppercase enum by invoicePatchSchema; these
  // rules add who-may-change-what (e.g. STAFF cannot cancel via PATCH).
  const denied = enforceInvoiceRules(existing, patch as Record<string, unknown>, auth.role);
  if (denied) return denied;
  if (Object.keys(patch).length === 0) return NextResponse.json(existing);

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
