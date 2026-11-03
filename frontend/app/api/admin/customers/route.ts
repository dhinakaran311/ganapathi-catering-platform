import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole, requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';

/* ── GET — list customers ───────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  // The search term is interpolated into a PostgREST or() filter, where `,`
  // `(` `)` `.` `*` `%` and `\` have syntax meaning. Strip them so a search
  // can't inject extra filter conditions.
  const q = (req.nextUrl.searchParams.get('q') ?? '')
    .replace(/[,().*%\\:"']/g, ' ')
    .trim()
    .slice(0, 80);

  let query = supabase
    .from('customers')
    .select('id, name, phone, email, customer_type, total_orders, total_spent, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── DELETE — delete customer (ADMIN+) ─────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  // ADMIN+ required to delete customers
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });

    const supabase = createAdminClient();

    // Unlink enquiries first (FK safety)
    await supabase.from('enquiries').update({ customer_id: null }).eq('customer_id', id);

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Audit
    await supabase.from('audit_logs').insert({
      user_id:    auth.user.id,
      action:     'CUSTOMER_DELETED',
      table_name: 'customers',
      record_id:  id,
      old_data:   { id },
      new_data:   null,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
