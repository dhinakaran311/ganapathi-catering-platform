// app/api/admin/payments/route.ts — Payment CRUD API (admin only)
//
// GET    /api/admin/payments?invoice_id=xxx     — list payments for an invoice
// GET    /api/admin/payments?enquiry_id=xxx     — list payments for an enquiry
// POST   /api/admin/payments                   — record a new payment
// PATCH  /api/admin/payments                   — verify or reject a payment

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole, requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { PaymentType, PaymentMethodType, PaymentStatusType } from '@/types/payment';

const VALID_TYPES:    PaymentType[]         = ['ADVANCE', 'PARTIAL', 'FINAL', 'OTHER'];
const VALID_METHODS:  PaymentMethodType[]   = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'];

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
    table_name: 'payments',
    record_id:  opts.recordId,
    old_data:   opts.oldData ?? null,
    new_data:   opts.newData ?? null,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   GET — list payments (VIEWER+)
───────────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const invoiceId = req.nextUrl.searchParams.get('invoice_id');
  const enquiryId = req.nextUrl.searchParams.get('enquiry_id');

  let query = supabase
    .from('payments')
    .select('*')
    .eq('is_deleted', false)
    .order('payment_date', { ascending: false });

  if (invoiceId) query = query.eq('invoice_id', invoiceId);
  if (enquiryId) query = query.eq('enquiry_id', enquiryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ─────────────────────────────────────────────────────────────────────────
   POST — record a new payment (STAFF+)
───────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const body = await req.json();
  const user = auth.user;

  /* ── validation ── */
  const { invoice_id, amount, payment_type, payment_method } = body;

  if (!invoice_id) {
    return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
  }

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }

  if (!VALID_TYPES.includes(payment_type)) {
    return NextResponse.json({ error: `payment_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  if (!VALID_METHODS.includes(payment_method)) {
    return NextResponse.json({ error: `payment_method must be one of: ${VALID_METHODS.join(', ')}` }, { status: 400 });
  }

  /* ── verify invoice exists (server-side) and pull relationships ── */
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, enquiry_id, customer_id, total_amount, status')
    .eq('id', invoice_id)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot record payment on a cancelled invoice' }, { status: 422 });
  }

  /* ── calculate current verified total (server-side) ── */
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoice_id)
    .eq('status', 'VERIFIED')
    .eq('is_deleted', false);

  const alreadyReceived = (existingPayments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const remainingBalance = Number(invoice.total_amount) - alreadyReceived;

  // Allow overpayment but flag it in response
  const willOverpay = parsedAmount > remainingBalance;

  /* ── insert payment ── */
  const { data: payment, error: insertErr } = await supabase
    .from('payments')
    .insert({
      invoice_id,
      enquiry_id:             invoice.enquiry_id,
      customer_id:            invoice.customer_id,
      amount:                 parsedAmount,
      payment_type,
      payment_method,
      transaction_reference:  body.transaction_reference?.trim() || null,
      payment_date:           body.payment_date || new Date().toISOString(),
      status:                 'PENDING',
      notes:                  body.notes?.trim() || null,
    })
    .select()
    .single();

  if (insertErr || !payment) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  /* ── audit log ── */
  await writeAudit({
    supabase,
    userId: user.id,
    action: 'PAYMENT_CREATED',
    recordId: payment.id,
    newData: payment,
  });

  return NextResponse.json({
    payment,
    willOverpay,
    overpayAmount: willOverpay ? parsedAmount - remainingBalance : 0,
    alreadyReceived,
    remainingBalance,
  }, { status: 201 });
}

/* ─────────────────────────────────────────────────────────────────────────
   PATCH — verify or reject a payment (ADMIN+)
   Body: { id, action: 'verify' | 'reject', rejection_reason? }
───────────────────────────────────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  // Verification/rejection is an ADMIN+ action
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const body = await req.json();
  const { id, action, rejection_reason } = body;
  const user = auth.user;

  if (!id)     return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (!action) return NextResponse.json({ error: 'action is required (verify | reject)' }, { status: 400 });

  /* fetch existing payment for audit */
  const { data: existing } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (existing.is_deleted) return NextResponse.json({ error: 'Payment is deleted' }, { status: 422 });

  let patch: Record<string, unknown>;
  let auditAction: string;

  if (action === 'verify') {
    if (existing.status === 'VERIFIED') {
      return NextResponse.json({ error: 'Payment is already verified' }, { status: 422 });
    }
    patch = {
      status:       'VERIFIED' as PaymentStatusType,
      verified_by:  user.id,
      verified_at:  new Date().toISOString(),
    };
    auditAction = 'PAYMENT_VERIFIED';

  } else if (action === 'reject') {
    if (existing.status === 'REJECTED') {
      return NextResponse.json({ error: 'Payment is already rejected' }, { status: 422 });
    }
    patch = {
      status:           'REJECTED' as PaymentStatusType,
      rejected_by:      user.id,
      rejected_at:      new Date().toISOString(),
      rejection_reason: rejection_reason?.trim() || 'Rejected by admin',
    };
    auditAction = 'PAYMENT_REJECTED';

  } else if (action === 'delete') {
    // Soft-delete only
    patch = { is_deleted: true };
    auditAction = 'PAYMENT_DELETED';

  } else {
    return NextResponse.json({ error: 'action must be one of: verify, reject, delete' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('payments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit({
    supabase,
    userId:   user.id,
    action:   auditAction,
    recordId: id,
    oldData:  existing,
    newData:  updated,
  });

  return NextResponse.json(updated);
}
