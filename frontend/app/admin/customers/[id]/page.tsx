// app/admin/customers/[id]/page.tsx — Customer detail with financial history

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Calendar, ClipboardList, IndianRupee, FileText } from 'lucide-react';
import { ENQUIRY_STATUS_COLORS, ENQUIRY_STATUS_LABELS, EnquiryStatus } from '@/types/enquiry';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, type InvoiceStatus } from '@/types/invoice';
import type { InvoicePaymentSummary } from '@/types/payment';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customer) notFound();

  // Fetch related enquiries
  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, event_type, event_date, guest_count, status, created_at')
    .eq('phone', customer.phone)
    .order('created_at', { ascending: false });

  // Fetch invoices for this customer
  const { data: invoices } = await adminSupabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, created_at')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  // Fetch payment summaries for all customer invoices
  const invoiceIds = (invoices ?? []).map((i: { id: string }) => i.id);
  let summaries: InvoicePaymentSummary[] = [];
  if (invoiceIds.length > 0) {
    const { data } = await adminSupabase
      .from('invoice_payment_summary')
      .select('*')
      .in('invoice_id', invoiceIds);
    summaries = (data ?? []) as InvoicePaymentSummary[];
  }

  const summaryMap = new Map<string, InvoicePaymentSummary>(
    summaries.map((s) => [s.invoice_id, s])
  );

  // Financial totals
  const totalInvoiced = (invoices ?? []).reduce((s: number, i: { total_amount: number }) => s + (i.total_amount ?? 0), 0);
  const totalReceived = summaries.reduce((s, sm) => s + Number(sm.amount_received), 0);
  const totalOutstanding = Math.max(totalInvoiced - totalReceived, 0);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — customer info */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-display font-bold mb-4"
              style={{ backgroundColor: 'var(--color-green-800)' }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-display text-xl font-bold text-[var(--color-brown-900)] mb-1">
              {customer.name}
            </h1>
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-2 font-body text-sm text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors mb-1"
            >
              <Phone size={14} /> {customer.phone}
            </a>
            {customer.email && (
              <p className="font-body text-sm text-[var(--color-brown-500)]">{customer.email}</p>
            )}

            <div className="mt-6 pt-6 border-t border-[var(--color-ivory-300)] grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-display text-2xl font-bold text-[var(--color-brown-900)]">
                  {customer.total_events ?? enquiries?.length ?? 0}
                </p>
                <p className="font-body text-xs text-[var(--color-brown-500)]">Total Events</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-[var(--color-brown-900)]">
                  {customer.last_event_date
                    ? new Date(customer.last_event_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : '—'}
                </p>
                <p className="font-body text-xs text-[var(--color-brown-500)]">Last Event</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          {invoiceIds.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
              <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4 flex items-center gap-2">
                <IndianRupee size={16} className="text-[var(--color-green-700)]" />
                Financial Summary
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Total Invoiced',   val: totalInvoiced,   cls: 'text-[var(--color-brown-900)]' },
                  { label: 'Amount Received',  val: totalReceived,   cls: 'text-green-700' },
                  { label: 'Outstanding',      val: totalOutstanding, cls: totalOutstanding > 0 ? 'text-orange-600 font-bold' : 'text-green-700' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-body text-sm text-[var(--color-brown-600)]">{label}</span>
                    <span className={`font-body text-sm font-semibold ${cls}`}>{fmt(val)}</span>
                  </div>
                ))}
              </div>
              {totalOutstanding === 0 && totalInvoiced > 0 && (
                <p className="mt-3 font-body text-xs text-green-600 text-center">✅ All invoices cleared</p>
              )}
              <p className="mt-3 font-body text-xs text-[var(--color-brown-400)]">
                Based on verified payments only
              </p>
            </div>
          )}
        </div>

        {/* Right — enquiry history + invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enquiry History */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-ivory-300)] flex items-center gap-2">
              <ClipboardList size={18} className="text-[var(--color-brown-500)]" />
              <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
                Enquiry History
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-ivory-200)]">
              {!enquiries || enquiries.length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-[var(--color-brown-400)]">
                  No enquiries found for this phone number.
                </p>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (enquiries as any[]).map((enq) => (
                  <Link
                    key={enq.id}
                    href={`/admin/enquiries/${enq.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-ivory-100)] transition-colors"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {enq.event_type}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-body text-xs text-[var(--color-brown-500)]">
                          {enq.guest_count} guests
                        </span>
                        {enq.event_date && (
                          <span className="flex items-center gap-1 font-body text-xs text-[var(--color-brown-500)]">
                            <Calendar size={10} />
                            {new Date(enq.event_date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-body text-xs font-semibold ${
                          ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status}
                      </span>
                      <span className="font-body text-xs text-[var(--color-brown-400)]">→</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Invoice History */}
          {invoiceIds.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-ivory-300)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--color-brown-500)]" />
                <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
                  Invoice History
                </h2>
              </div>
              <div className="divide-y divide-[var(--color-ivory-200)]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(invoices as any[]).map((inv) => {
                  const sm = summaryMap.get(inv.id);
                  const received = sm ? Number(sm.amount_received) : 0;
                  const balance  = sm ? Number(sm.balance_due)    : inv.total_amount;
                  const invStatus = (inv.status as InvoiceStatus) ?? 'DRAFT';
                  return (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm font-bold text-[var(--color-green-800)]">
                          {inv.invoice_number}
                        </p>
                        <p className="font-body text-xs text-[var(--color-brown-400)] mt-0.5">
                          {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                          {fmt(inv.total_amount)}
                        </p>
                        {received > 0 && (
                          <p className="font-body text-xs text-green-600">Received: {fmt(received)}</p>
                        )}
                        {balance > 0 && (
                          <p className="font-body text-xs text-orange-600">Balance: {fmt(balance)}</p>
                        )}
                      </div>
                      <span className={`ml-4 px-2 py-0.5 rounded-full font-body text-xs font-semibold ${INVOICE_STATUS_COLORS[invStatus]}`}>
                        {INVOICE_STATUS_LABELS[invStatus]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
