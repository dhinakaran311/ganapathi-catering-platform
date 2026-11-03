// app/api/admin/invoices/[id]/pdf/route.ts
// H69: Invoice PDF generation.
//
// GET /api/admin/invoices/{id}/pdf → streams a PDF of the invoice.
// Uses @react-pdf/renderer's renderToBuffer (Node-only — fine in a route
// handler). Requires VIEWER+ role. Falls back gracefully if the invoice has
// no line items.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Invoice, InvoiceData } from '@/types/invoice';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1A3D20' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#1A3D20' },
  brandSub: { fontSize: 9, color: '#6B5744', marginTop: 2 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  muted: { fontSize: 9, color: '#6B5744', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1, color: '#9C7A2E', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E8E2D5' },
  colDesc: { width: '46%' },
  colQty: { width: '14%', textAlign: 'right' },
  colPrice: { width: '18%', textAlign: 'right' },
  colTotal: { width: '22%', textAlign: 'right' },
  totals: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '60%', paddingVertical: 2 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', width: '60%', paddingVertical: 4, marginTop: 4, borderTopWidth: 1, borderTopColor: '#1A3D20' },
  bold: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 36, right: 36, fontSize: 8, color: '#6B5744', textAlign: 'center' },
});

function InvoiceDoc({ invoice, data }: { invoice: Invoice; data: InvoiceData }) {
  const lineItems = data.lineItems ?? [];
  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Shri Ganapathi Mess</Text>
            <Text style={styles.brandSub}>Traditional Home-Style Catering · Tiruppur</Text>
            <Text style={styles.brandSub}>+91 99423 51280</Text>
          </View>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.muted}>{invoice.invoice_number}</Text>
            <Text style={styles.muted}>{new Date(invoice.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
        </View>

        {/* Bill to */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text>{data.customerName || '—'}</Text>
          {data.customerPhone ? <Text style={styles.brandSub}>{data.customerPhone}</Text> : null}
          {data.customerAddress ? <Text style={styles.brandSub}>{data.customerAddress}</Text> : null}
          {data.eventType || data.eventDate ? (
            <Text style={styles.brandSub}>
              {[data.eventType, data.eventDate].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEMS</Text>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={[styles.colDesc, styles.bold]}>Description</Text>
            <Text style={[styles.colQty, styles.bold]}>Qty</Text>
            <Text style={[styles.colPrice, styles.bold]}>Rate</Text>
            <Text style={[styles.colTotal, styles.bold]}>Total</Text>
          </View>
          {lineItems.map((it) => (
            <View key={it.id} style={[styles.row, styles.rowBorder]}>
              <Text style={styles.colDesc}>{it.description}</Text>
              <Text style={styles.colQty}>{`${it.qty} ${it.unit}`}</Text>
              <Text style={styles.colPrice}>{fmt(it.unitPrice)}</Text>
              <Text style={styles.colTotal}>{fmt(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text>Subtotal</Text><Text>{fmt(data.subtotal)}</Text></View>
          {(data.deliveryCharge ?? 0) > 0 && (
            <View style={styles.totalRow}><Text>Delivery</Text><Text>{fmt(data.deliveryCharge)}</Text></View>
          )}
          {(data.discountAmount ?? 0) > 0 && (
            <View style={styles.totalRow}><Text>Discount</Text><Text>-{fmt(data.discountAmount)}</Text></View>
          )}
          {(data.taxAmount ?? 0) > 0 && (
            <View style={styles.totalRow}><Text>{`Tax (${data.taxRate}%)`}</Text><Text>{fmt(data.taxAmount)}</Text></View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.bold}>TOTAL</Text>
            <Text style={styles.bold}>{fmt(data.total ?? invoice.total_amount)}</Text>
          </View>
        </View>

        {/* Notes / terms */}
        {(data.notes || data.terms) && (
          <View style={[styles.section, { marginTop: 20 }]}>
            {data.notes ? <Text style={styles.brandSub}>Note: {data.notes}</Text> : null}
            {data.terms ? <Text style={styles.brandSub}>{data.terms}</Text> : null}
          </View>
        )}

        <Text style={styles.footer}>
          Thank you for choosing Shri Ganapathi Mess · Advance booking via WhatsApp
        </Text>
      </Page>
    </Document>
  );
}

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
  const data = (typed.invoice_data ?? {}) as InvoiceData;

  const buffer = await renderToBuffer(InvoiceDoc({ invoice: typed, data }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${typed.invoice_number || 'invoice'}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
