// app/api/admin/invoices/route.ts — Phase 5: Invoice CRUD API

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/* GET  /api/admin/invoices?enquiry_id=xxx  — list invoices for an enquiry */
export async function GET(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

/* POST /api/admin/invoices  — create new invoice */
export async function POST(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const supabase = createAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      status: body.status ?? 'pending',
      payment_method: body.payment_method ?? null,
      notes: body.notes ?? null,
      invoice_number: '', // DB trigger fills this
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* PUT /api/admin/invoices  — update full invoice */
export async function PUT(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const supabase = createAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('invoices')
    .update(rest)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* PATCH /api/admin/invoices  — partial update (status, sent_at, paid_at, etc.) */
export async function PATCH(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const supabase = createAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('invoices')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* DELETE /api/admin/invoices?id=xxx */
export async function DELETE(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const supabase = createAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
