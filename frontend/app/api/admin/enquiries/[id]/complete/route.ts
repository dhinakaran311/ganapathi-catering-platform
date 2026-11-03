// app/api/admin/enquiries/[id]/complete/route.ts
// POST — complete an order (event + financial settlement)
//
// This route calls the complete_order() DB function which:
//   1. Validates the enquiry is completable (not CANCELLED)
//   2. Calculates actual balance from payments (never trusts client values)
//   3. Marks enquiry COMPLETED
//   4. Marks invoice PAID only if balance_due = 0
//   5. Writes ORDER_COMPLETED audit log
//
// Does NOT create fake payments. Does NOT auto-mark PAID if balance > 0.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import { completeOrderSchema, zodFieldErrors } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ADMIN+ required to complete orders (STAFF cannot complete)
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = completeOrderSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: zodFieldErrors(parsed.error) },
      { status: 422 }
    );
  }
  const notes: string | null = parsed.data.notes ?? null;

  const supabase = createAdminClient();

  // Call the DB function — all business logic lives there
  // The function calculates real balance from the payments table server-side.
  // It never trusts any amount values from the request body.
  const { data, error } = await supabase.rpc('complete_order', {
    p_enquiry_id: id,
    p_user_id:    auth.user.id,
    p_notes:      notes,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as {
    success:            boolean;
    error?:             string;
    enquiry_id:         string;
    old_enquiry_status: string;
    new_enquiry_status: string;
    invoice_id:         string | null;
    invoice_number:     string | null;
    old_invoice_status: string | null;
    new_invoice_status: string | null;
    amount_received:    number;
    balance_due:        number;
    payment_status:     string;
    audit_id:           string;
  };

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Order completion failed' }, { status: 422 });
  }

  return NextResponse.json(result, { status: 200 });
}

// GET — preview order completion details (balance, payment status) without committing
// The UI uses this to show the confirmation dialog with accurate numbers.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch enquiry
  const { data: enquiry, error: enqErr } = await supabase
    .from('enquiries')
    .select('id, status, name, event_type, event_date, guest_count')
    .eq('id', id)
    .single();

  if (enqErr || !enquiry) {
    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
  }

  if (enquiry.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot complete a cancelled order' }, { status: 422 });
  }

  // Find most recent active invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status')
    .eq('enquiry_id', id)
    .eq('is_deleted', false)
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get real payment summary from the DB view (source of truth)
  let summary = { amount_received: 0, balance_due: 0, payment_status: 'UNPAID' };
  if (invoice) {
    const { data: ps } = await supabase
      .from('invoice_payment_summary')
      .select('amount_received, balance_due, payment_status')
      .eq('invoice_id', invoice.id)
      .maybeSingle();

    if (ps) {
      summary = {
        amount_received: Number(ps.amount_received),
        balance_due:     Number(ps.balance_due),
        payment_status:  ps.payment_status,
      };
    }
  }

  return NextResponse.json({
    enquiry_status:   enquiry.status,
    customer_name:    enquiry.name,
    event_type:       enquiry.event_type,
    event_date:       enquiry.event_date,
    invoice_number:   invoice?.invoice_number ?? null,
    total_amount:     invoice?.total_amount ?? 0,
    amount_received:  summary.amount_received,
    balance_due:      summary.balance_due,
    payment_status:   summary.payment_status,
    will_mark_paid:   summary.balance_due === 0 && summary.amount_received > 0,
  });
}
