// app/admin/enquiries/[id]/invoice/page.tsx — Phase 5 + Payment System
// Create/Edit invoice for an enquiry — now includes Payment Panel below the builder.

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import InvoiceBuilder from '@/components/admin/InvoiceBuilder';
import InvoicePaymentPanel from '@/components/admin/InvoicePaymentPanel';
import type { InvoiceData } from '@/types/invoice';
import type { InvoicePaymentSummary } from '@/types/payment';

export default async function EnquiryInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Fetch the enquiry
  const { data: enq, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !enq) notFound();

  // Check if an invoice already exists for this enquiry
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('enquiry_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Pre-fill default invoice data from the enquiry
  const defaultData: Partial<InvoiceData> = existingInvoice
    ? (existingInvoice.invoice_data as InvoiceData)
    : {
        customerName: enq.name ?? '',
        customerPhone: enq.phone ?? '',
        eventType: enq.event_type ?? '',
        eventDate: enq.event_date ?? '',
        eventLocation: enq.event_location ?? '',
        guestCount: enq.guest_count ?? '',
        foodType: enq.food_type ?? '',
        lineItems: [],
        subtotal: 0,
        deliveryCharge: 0,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: 0,
      };

  // If invoice exists, load payment data server-side
  let initialPayments: import('@/types/payment').Payment[] = [];
  let initialSummary: InvoicePaymentSummary = {
    invoice_id:            existingInvoice?.id ?? '',
    invoice_number:        existingInvoice?.invoice_number ?? '',
    total_amount:          existingInvoice?.total_amount ?? 0,
    invoice_status:        existingInvoice?.status ?? 'DRAFT',
    amount_received:       0,
    balance_due:           existingInvoice?.total_amount ?? 0,
    payment_status:        'UNPAID',
    overpaid_amount:       0,
    total_payment_count:   0,
    pending_payment_count: 0,
  };

  if (existingInvoice?.id) {
    const [paymentsRes, summaryRes] = await Promise.all([
      adminSupabase
        .from('payments')
        .select('*')
        .eq('invoice_id', existingInvoice.id)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false }),
      adminSupabase
        .from('invoice_payment_summary')
        .select('*')
        .eq('invoice_id', existingInvoice.id)
        .single(),
    ]);

    initialPayments = (paymentsRes.data ?? []) as import('@/types/payment').Payment[];
    if (summaryRes.data) initialSummary = summaryRes.data as InvoicePaymentSummary;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <Link
            href={`/admin/enquiries/${id}`}
            className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Enquiry
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] flex items-center gap-2 mb-1">
                <FileText size={24} className="text-[var(--color-gold-600)] flex-shrink-0" />
                <span className="truncate">
                  {existingInvoice ? `Edit Invoice — ${existingInvoice.invoice_number}` : 'Create Invoice'}
                </span>
              </h1>
              <p className="font-body text-xs md:text-sm text-[var(--color-brown-500)]">
                For enquiry from <span className="font-semibold text-[var(--color-brown-800)]">{enq.name}</span>
                {enq.event_type && ` · ${enq.event_type}`}
                {enq.event_date && ` · ${new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>
            {existingInvoice && (() => {
              const s = (existingInvoice.status as import('@/types/invoice').InvoiceStatus) ?? 'DRAFT';
              const colors = { DRAFT: 'bg-gray-100 text-gray-600', SENT: 'bg-blue-100 text-blue-700', PARTIALLY_PAID: 'bg-orange-100 text-orange-700', PAID: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };
              const labels = { DRAFT: 'Draft', SENT: 'Sent', PARTIALLY_PAID: 'Partially Paid', PAID: 'Paid', CANCELLED: 'Cancelled' };
              return (
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-body text-xs font-bold uppercase tracking-wide whitespace-nowrap ${colors[s] ?? 'bg-gray-100 text-gray-600'}`}>
                  {labels[s] ?? s}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Invoice Builder (always shown) */}
      <InvoiceBuilder
        enquiryId={id}
        defaultData={defaultData}
        existingInvoiceId={existingInvoice?.id}
      />

      {/* Payment Panel — only shown when an invoice has been saved */}
      {existingInvoice && (
        <div className="mt-10">
          <InvoicePaymentPanel
            invoiceId={existingInvoice.id}
            invoiceNumber={existingInvoice.invoice_number}
            totalAmount={existingInvoice.total_amount}
            initialPayments={initialPayments}
            initialSummary={initialSummary}
          />
        </div>
      )}
    </div>
  );
}
