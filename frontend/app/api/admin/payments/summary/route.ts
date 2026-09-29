// app/api/admin/payments/summary/route.ts
// Returns the invoice_payment_summary view data for a single invoice.
// GET /api/admin/payments/summary?invoice_id=xxx

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoiceId = req.nextUrl.searchParams.get('invoice_id');
  if (!invoiceId) return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('invoice_payment_summary')
    .select('*')
    .eq('invoice_id', invoiceId)
    .single();

  if (error || !data) {
    // Invoice may exist but have no rows yet in the view — build a safe default
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, status')
      .eq('id', invoiceId)
      .single();

    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    return NextResponse.json({
      invoice_id:           inv.id,
      invoice_number:       inv.invoice_number,
      total_amount:         inv.total_amount,
      invoice_status:       inv.status,
      amount_received:      0,
      balance_due:          inv.total_amount,
      payment_status:       'UNPAID',
      overpaid_amount:      0,
      total_payment_count:  0,
      pending_payment_count: 0,
    });
  }

  return NextResponse.json(data);
}
