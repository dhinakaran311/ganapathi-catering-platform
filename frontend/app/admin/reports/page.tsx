// app/admin/reports/page.tsx — Analytics and financial reports

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEnquiriesByStatus } from '@/lib/analytics/queries';
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS } from '@/types/enquiry';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, INVOICE_STATUSES, type InvoiceStatus } from '@/types/invoice';
import type { InvoicePaymentSummary } from '@/types/payment';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

async function ReportsContent() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Enquiry stats
  const statusCounts = await getEnquiriesByStatus();

  // Invoice stats by status
  const { data: invoices } = await adminSupabase
    .from('invoices')
    .select('id, status, total_amount');

  const invoicesByStatus: Record<string, number> = {};
  INVOICE_STATUSES.forEach((s) => { invoicesByStatus[s] = 0; });
  (invoices ?? []).forEach(({ status }: { status: string }) => {
    const s = status as InvoiceStatus;
    invoicesByStatus[s] = (invoicesByStatus[s] ?? 0) + 1;
  });

  // Payment financial totals
  const { data: summaries } = await adminSupabase
    .from('invoice_payment_summary')
    .select('*');

  const totalInvoiced   = (invoices ?? []).filter((i: { status: string }) => i.status !== 'CANCELLED').reduce((s: number, i: { total_amount: number }) => s + (i.total_amount ?? 0), 0);
  const totalReceived   = (summaries ?? []).reduce((s: number, sm: InvoicePaymentSummary) => s + Number(sm.amount_received), 0);
  const totalOutstanding = Math.max(totalInvoiced - totalReceived, 0);
  const paidCount       = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'PAID').length;
  const partialCount    = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'PARTIALLY_PAID').length;
  const unpaidCount     = (summaries ?? []).filter((sm: InvoicePaymentSummary) => sm.payment_status === 'UNPAID').length;

  // Payment method breakdown
  const { data: payments } = await adminSupabase
    .from('payments')
    .select('payment_method, amount, status')
    .eq('is_deleted', false);

  const verifiedByMethod: Record<string, number> = {};
  (payments ?? []).forEach(({ payment_method, amount, status }: { payment_method: string; amount: number; status: string }) => {
    if (status === 'VERIFIED') {
      verifiedByMethod[payment_method] = (verifiedByMethod[payment_method] ?? 0) + Number(amount);
    }
  });

  // Monthly enquiry breakdown (last 6 months)
  const { data: monthly } = await supabase
    .from('enquiries')
    .select('created_at, status, event_type')
    .gte('created_at', // eslint-disable-next-line react-hooks/purity
    new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const eventCounts: Record<string, number> = {};
  (monthly ?? []).forEach(({ event_type }: { event_type: string }) => {
    if (event_type) eventCounts[event_type] = (eventCounts[event_type] ?? 0) + 1;
  });

  const topEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = Object.values(eventCounts).reduce((a, b) => a + b, 0) || 1;

  const reportColors: Record<string, string> = {
    NEW: '#996B0C', CONTACTED: '#2c5282', DISCUSSION: '#6b46c1',
    QUOTE_SENT: '#434190', FOLLOW_UP: '#c05621', CONFIRMED: '#205728',
    COMPLETED: '#6B5744', CANCELLED: '#dc2626',
  };

  const methodLabels: Record<string, string> = {
    UPI: '📱 UPI', CASH: '💵 Cash', BANK_TRANSFER: '🏦 Bank Transfer',
    CHEQUE: '📝 Cheque', OTHER: '💳 Other',
  };

  return (
    <div className="space-y-8">

      {/* ── Financial Summary ── */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
          Financial Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          {[
            { label: 'Total Invoiced',   val: fmt(totalInvoiced),   cls: 'text-[var(--color-brown-900)]' },
            { label: 'Amount Received',  val: fmt(totalReceived),   cls: 'text-green-700' },
            { label: 'Outstanding',      val: fmt(totalOutstanding), cls: totalOutstanding > 0 ? 'text-orange-700 font-bold' : 'text-green-700' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="rounded-lg border border-[var(--color-ivory-300)] p-3 sm:p-4 text-center">
              <p className={`font-display text-xl sm:text-2xl font-bold mb-1 ${cls}`}>{val}</p>
              <p className="font-body text-xs text-[var(--color-brown-500)]">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Paid',          count: paidCount,    cls: 'text-green-700 bg-green-50 border-green-200' },
            { label: 'Partially Paid', count: partialCount, cls: 'text-orange-700 bg-orange-50 border-orange-200' },
            { label: 'Unpaid',        count: unpaidCount,  cls: 'text-red-700 bg-red-50 border-red-200' },
          ].map(({ label, count, cls }) => (
            <div key={label} className={`rounded-lg border px-2 sm:px-4 py-2 sm:py-3 text-center ${cls}`}>
              <p className="font-display text-xl sm:text-2xl font-bold">{count}</p>
              <p className="font-body text-[10px] sm:text-xs font-semibold">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-body text-xs text-[var(--color-brown-400)]">
          Amount Received = sum of VERIFIED payments only. Pending/Rejected payments are excluded.
        </p>
      </div>

      {/* ── Payment Method Breakdown ── */}
      {Object.keys(verifiedByMethod).length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
            Payment Method Breakdown (Verified)
          </h2>
          <div className="space-y-3">
            {Object.entries(verifiedByMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
              <div key={method}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm font-medium text-[var(--color-brown-800)]">
                    {methodLabels[method] ?? method}
                  </span>
                  <span className="font-body text-sm font-bold text-[var(--color-brown-900)]">{fmt(amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-ivory-300)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((amount / totalReceived) * 100)}%`,
                      backgroundColor: 'var(--color-green-700)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invoice Status Breakdown ── */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
          Invoice Status Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {INVOICE_STATUSES.map((s) => (
            <div key={s} className={`rounded-lg border px-3 sm:px-4 py-3 sm:py-4 text-center ${INVOICE_STATUS_COLORS[s]}`}>
              <p className="font-display text-2xl sm:text-3xl font-bold mb-1">{invoicesByStatus[s] ?? 0}</p>
              <p className="font-body text-[10px] sm:text-xs font-semibold">{INVOICE_STATUS_LABELS[s]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Enquiry Status Breakdown ── */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
          Enquiry Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
          {ENQUIRY_STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-[var(--color-ivory-300)] p-3 sm:p-4 text-center"
            >
              <p
                className="font-display text-2xl sm:text-3xl font-bold mb-1"
                style={{ color: reportColors[status] || '#6B5744' }}
              >
                {statusCounts[status] ?? 0}
              </p>
              <p className="font-body text-xs sm:text-sm text-[var(--color-brown-500)] capitalize">{ENQUIRY_STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Event Types ── */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
          Top Event Types (Last 6 Months)
        </h2>
        {topEvents.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-brown-400)] text-center py-8">
            No event data yet.
          </p>
        ) : (
          <div className="space-y-3">
            {topEvents.map(([event, count]) => (
              <div key={event}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm font-medium text-[var(--color-brown-800)]">{event}</span>
                  <span className="font-body text-sm font-bold text-[var(--color-brown-900)]">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-ivory-300)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((count / total) * 100)}%`,
                      backgroundColor: 'var(--color-green-700)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Analytics &amp; Reports
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Financial overview, enquiry trends, event breakdown, and payment method analysis
        </p>
      </div>
      <ReportsContent />
    </div>
  );
}
