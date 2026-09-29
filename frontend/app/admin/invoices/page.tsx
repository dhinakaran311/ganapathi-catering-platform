// app/admin/invoices/page.tsx — Updated with Payment Status from payments table

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, Plus, CheckCircle, Clock, Send, XCircle, IndianRupee } from 'lucide-react';
import type { Invoice, InvoiceData, InvoiceStatus } from '@/types/invoice';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/types/invoice';
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_COLORS,
  type InvoicePaymentSummary,
} from '@/types/payment';

const INVOICE_STATUS_ICON: Record<InvoiceStatus, typeof FileText> = {
  DRAFT:          FileText,
  SENT:           Send,
  PARTIALLY_PAID: Clock,
  PAID:           CheckCircle,
  CANCELLED:      XCircle,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default async function InvoicesPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  // Load payment summaries from the DB view for all invoices
  const { data: summaries } = await adminSupabase
    .from('invoice_payment_summary')
    .select('*');

  const summaryMap = new Map<string, InvoicePaymentSummary>(
    (summaries ?? []).map((s: InvoicePaymentSummary) => [s.invoice_id, s])
  );

  // Financial aggregates from verified payments (source of truth)
  const totalInvoiced   = (invoices ?? []).reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const totalReceived   = (summaries ?? []).reduce((s: number, sm: InvoicePaymentSummary) => s + Number(sm.amount_received), 0);
  const totalOutstanding = Math.max(totalInvoiced - totalReceived, 0);
  const paidCount       = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'PAID').length;
  const partialCount    = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'PARTIALLY_PAID').length;
  const unpaidCount     = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'UNPAID').length;
  const totalInvoices   = invoices?.length ?? 0;

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-brown-900)]">Invoices</h1>
          <p className="font-body text-sm text-[var(--color-brown-500)] mt-1">
            All generated invoices — payment status calculated from verified transactions
          </p>
        </div>
        <Link
          href="/admin/enquiries"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors"
        >
          <Plus size={16} /> New Invoice (from Enquiry)
        </Link>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Invoiced',  value: fmt(totalInvoiced),   sub: `${totalInvoices} invoices`, color: 'text-[var(--color-brown-900)]' },
          { label: 'Amount Received', value: fmt(totalReceived),   sub: 'from verified payments',   color: 'text-green-700' },
          { label: 'Outstanding',     value: fmt(totalOutstanding), sub: 'balance due',              color: 'text-orange-700' },
          { label: 'Paid',            value: paidCount,             sub: `${partialCount} partial · ${unpaidCount} unpaid`, color: 'text-[var(--color-green-800)]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-5">
            <p className="font-body text-xs text-[var(--color-brown-400)] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-body text-xs text-[var(--color-brown-400)] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Payment Status Quick Counts */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Paid', count: paidCount, cls: 'text-green-700 bg-green-50 border-green-200' },
          { label: 'Partially Paid', count: partialCount, cls: 'text-orange-700 bg-orange-50 border-orange-200' },
          { label: 'Unpaid', count: unpaidCount, cls: 'text-red-700 bg-red-50 border-red-200' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 text-center ${cls}`}>
            <p className="font-display text-2xl font-bold">{count}</p>
            <p className="font-body text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center font-body text-sm text-red-600">
            Failed to load invoices. Make sure the invoices table is set up in Supabase.
          </div>
        ) : !invoices?.length ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto text-[var(--color-ivory-400)] mb-4" />
            <p className="font-display text-lg font-bold text-[var(--color-brown-700)] mb-1">No invoices yet</p>
            <p className="font-body text-sm text-[var(--color-brown-400)] mb-6">
              Open any enquiry and click &quot;Create Invoice&quot; to get started.
            </p>
            <Link href="/admin/enquiries" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors">
              Go to Enquiries
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
                <tr>
                  {['Invoice #', 'Customer', 'Event', 'Date', 'Total', 'Received', 'Balance', 'Payment', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(invoices as Invoice[]).map((inv) => {
                  const data      = inv.invoice_data as InvoiceData;
                  const status    = (inv.status as InvoiceStatus) ?? 'DRAFT';
                  const StatusIcon = INVOICE_STATUS_ICON[status] ?? FileText;
                  const statusColor = INVOICE_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
                  const statusLabel = INVOICE_STATUS_LABELS[status] ?? status;
                  const summary   = summaryMap.get(inv.id);

                  // Prefer new payments table; fall back to legacy invoice_data for old records
                  const amountReceived = summary
                    ? Number(summary.amount_received)
                    : (data?.advancePaid ?? 0);
                  const balanceDue = summary
                    ? Number(summary.balance_due)
                    : Math.max(inv.total_amount - (data?.advancePaid ?? 0), 0);
                  const paymentStatus = summary?.payment_status ?? (amountReceived === 0 ? 'UNPAID' : amountReceived >= inv.total_amount ? 'PAID' : 'PARTIALLY_PAID');
                  const psColor = INVOICE_PAYMENT_STATUS_COLORS[paymentStatus as keyof typeof INVOICE_PAYMENT_STATUS_COLORS];
                  const psLabel = INVOICE_PAYMENT_STATUS_LABELS[paymentStatus as keyof typeof INVOICE_PAYMENT_STATUS_LABELS];

                  return (
                    <tr key={inv.id} className="border-b border-[var(--color-ivory-200)] hover:bg-[var(--color-ivory-100)] transition-colors group">
                      <td className="px-4 py-4">
                        <span className="font-body text-sm font-bold text-[var(--color-green-800)]">
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">{data?.customerName ?? '—'}</p>
                        <p className="font-body text-xs text-[var(--color-brown-400)]">{data?.customerPhone ?? ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-sm text-[var(--color-brown-700)]">{data?.eventType ?? '—'}</p>
                        <p className="font-body text-xs text-[var(--color-brown-400)]">{data?.guestCount ? `${data.guestCount} guests` : ''}</p>
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-[var(--color-brown-600)]">
                        {data?.eventDate ? new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-4 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {fmt(inv.total_amount)}
                      </td>
                      <td className="px-4 py-4 font-body text-sm font-semibold text-green-700">
                        {fmt(amountReceived)}
                      </td>
                      <td className="px-4 py-4">
                        {balanceDue > 0 ? (
                          <span className="font-body text-sm font-semibold text-orange-600">{fmt(balanceDue)}</span>
                        ) : (
                          <span className="font-body text-sm font-semibold text-green-600">✅ Clear</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-semibold border ${psColor}`}>
                          {psLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs font-semibold ${statusColor}`}>
                          <StatusIcon size={12} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {inv.enquiry_id && (
                          <Link
                            href={`/admin/enquiries/${inv.enquiry_id}/invoice`}
                            className="font-body text-xs font-semibold text-[var(--color-green-800)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Manage →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about legacy data */}
      <p className="mt-4 font-body text-xs text-[var(--color-brown-400)] text-center">
        <IndianRupee size={10} className="inline" /> Amount Received is calculated from verified payments in the payments table.
        Legacy advance payments have been automatically migrated.
      </p>
    </div>
  );
}
