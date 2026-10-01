import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete customer using admin client (service role) to bypass RLS if necessary,
    // though auth client should work if RLS allows admins to delete.
    const adminSupabase = createAdminClient();

    // 1. Manually unlink enquiries to prevent foreign key constraint violation
    // (In case the database doesn't have ON DELETE SET NULL configured)
    await adminSupabase
      .from('enquiries')
      .update({ customer_id: null })
      .eq('customer_id', id);

    // 2. Now delete the customer safely
    const { error } = await adminSupabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
