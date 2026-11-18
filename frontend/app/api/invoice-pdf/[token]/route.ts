// app/api/invoice-pdf/[token]/route.ts — the customer's invoice link.
//
// Opened from the WhatsApp message the admin sends. No login: access is
// granted by the signed, expiring token (lib/invoice/share-link.server.ts).
// Cancelled / deleted invoices are not served. Rate-limited per IP.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Invoice } from '@/types/invoice';
import { verifyInvoiceToken } from '@/lib/invoice/share-link.server';
import { renderInvoicePdf, invoicePdfFilename } from '@/lib/invoice/pdf-document';
import { getClientIp, hashIdentifier } from '@/lib/security/request';
import { checkRateLimits } from '@/lib/security/rate-limit';
import { SITE } from '@/lib/site';

const NO_INDEX = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' };

function message(status: number, text: string) {
  return new NextResponse(`${text}\n\n${SITE.nameEn} · ${SITE.phoneDisplay}`, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...NO_INDEX },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const allowed = await checkRateLimits([
    { bucket: `invoice-link:ip:${hashIdentifier(getClientIp(req))}`, limit: 30, windowSeconds: 600 },
  ]);
  if (!allowed) return message(429, 'Too many requests. Please try again in a few minutes.');

  const { token } = await params;
  const check = verifyInvoiceToken(token);
  if (!check.ok) {
    return check.reason === 'expired'
      ? message(410, 'This invoice link has expired. Please ask us on WhatsApp for a new link.')
      : message(404, 'This invoice link is not valid.');
  }

  const { data: invoice } = await createAdminClient()
    .from('invoices')
    .select('*')
    .eq('id', check.invoiceId)
    .maybeSingle();

  // is_deleted comes from migration 017 (soft delete) and isn't on the Invoice type.
  const typed = invoice as (Invoice & { is_deleted?: boolean }) | null;
  if (!typed || typed.is_deleted || typed.status === 'CANCELLED') {
    return message(404, 'This invoice is no longer available. Please contact us for details.');
  }

  const buffer = await renderInvoicePdf(typed);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoicePdfFilename(typed)}"`,
      ...NO_INDEX,
    },
  });
}
