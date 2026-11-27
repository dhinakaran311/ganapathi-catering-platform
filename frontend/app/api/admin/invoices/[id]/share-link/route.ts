// app/api/admin/invoices/[id]/share-link/route.ts
// POST → a signed, expiring public link to the invoice PDF, for the WhatsApp
// message the admin sends to the customer. STAFF+ (same as sending).

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { createInvoiceToken, LINK_TTL_DAYS } from '@/lib/invoice/share-link.server';
import { getPublicOrigin } from '@/lib/security/request';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMinRole('STAFF');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { data: invoice } = await createAdminClient()
    .from('invoices')
    .select('id, status, is_deleted')
    .eq('id', id)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.is_deleted || invoice.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cancelled invoices cannot be shared.' }, { status: 422 });
  }

  // Public origin of the site (set NEXT_PUBLIC_SITE_URL in production if the
  // admin is ever opened through a different host).
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || getPublicOrigin(req)).replace(/\/$/, '');
  const url = `${origin}/api/invoice-pdf/${createInvoiceToken(invoice.id)}`;

  return NextResponse.json({ url, expiresInDays: LINK_TTL_DAYS });
}
