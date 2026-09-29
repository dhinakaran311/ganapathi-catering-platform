// app/admin/enquiries/[id]/invoice/page.tsx — Phase 5: Create/Edit invoice for an enquiry

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import InvoiceBuilder from '@/components/admin/InvoiceBuilder';
import type { InvoiceData } from '@/types/invoice';

export default async function EnquiryInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
        advancePaid: 0,
        balanceDue: 0,
      };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href={`/admin/enquiries/${id}`}
            className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Enquiry
          </Link>
          <h1 className="font-display text-2xl font-bold text-[var(--color-brown-900)] flex items-center gap-2">
            <FileText size={24} className="text-[var(--color-gold-600)]" />
            {existingInvoice ? `Edit Invoice — ${existingInvoice.invoice_number}` : 'Create Invoice'}
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)] mt-0.5">
            For enquiry from <span className="font-semibold text-[var(--color-brown-800)]">{enq.name}</span>
            {enq.event_type && ` · ${enq.event_type}`}
            {enq.event_date && ` · ${new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>

        {existingInvoice && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-xs font-bold uppercase tracking-wide
            ${existingInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              existingInvoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
              existingInvoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-orange-100 text-orange-700'}`}
          >
            {existingInvoice.status}
          </div>
        )}
      </div>

      <InvoiceBuilder
        enquiryId={id}
        defaultData={defaultData}
        existingInvoiceId={existingInvoice?.id}
      />
    </div>
  );
}
