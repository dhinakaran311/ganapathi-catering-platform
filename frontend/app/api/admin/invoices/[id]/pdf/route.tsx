// app/api/admin/invoices/[id]/pdf/route.ts
// H69: Invoice PDF generation.
//
// GET /api/admin/invoices/{id}/pdf → streams a PDF of the invoice.
// Requires VIEWER+ role. Rendering lives in lib/invoice/pdf-document.tsx
// (shared with the customer's secure invoice link).

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { Invoice } from '@/types/invoice';
import { renderInvoicePdf, invoicePdfFilename } from '@/lib/invoice/pdf-document';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const typed = invoice as Invoice;
  const buffer = await renderInvoicePdf(typed);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoicePdfFilename(typed)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
