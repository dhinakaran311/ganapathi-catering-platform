// app/admin/payments/page.tsx — Payments management page
// Shows all payments with filters: date, status, method, customer, invoice.
// Data comes from the payments table — source of truth for financial records.
// Amount Received = SUM(VERIFIED payments) per invoice.

import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  type PaymentStatusType,
  type PaymentType,
  type PaymentMethodType,
} from '@/types/payment';
import Pagination from '@/components/admin/Pagination';
import { pageRange, parsePage } from '@/lib/admin/pagination';

const PAGE_SIZE = 50;

interface SearchParams {
  status?: string;
  method?: string;
  q?: string;
  page?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_ICON: Record<PaymentStatusType, typeof CheckCircle> = {
  PENDING:  Clock,
  VERIFIED: CheckCircle,
  REJECTED: XCircle,
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { status, method, q } = params;
  // Without a search term the list is paginated server-side. A search term
  // matches joined invoice/customer data in memory, so it keeps the original
  // behaviour (latest 200 matching rows, no pagination).
  const paginate = !q;
  const page = parsePage(params.page);
  const [from, to] = pageRange(page, PAGE_SIZE);

  const supabase = createAdminClient();

  // Fetch payments with invoice + enquiry context
  // Using a join-like select — avoids N+1 queries
  let query = supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_type,
      payment_method,
      transaction_reference,
      payment_date,
      status,
      notes,
      is_deleted,
      is_legacy_migrated,
      created_at,
      invoice_id,
      enquiry_id,
      customer_id,
      verified_at,
      rejected_at,
      rejection_reason
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .order('payment_date', { ascending: false });
  query = paginate ? query.range(from, to) : query.limit(200);

  // Totals cover ALL payments matching the filters, not just this page.
  let totalsQuery = supabase
    .from('payments')
    .select('amount, status')
    .eq('is_deleted', false);

  if (status && status !== 'all') {
    query = query.eq('status', status as PaymentStatusType);
    totalsQuery = totalsQuery.eq('status', status as PaymentStatusType);
  }
  if (method && method !== 'all') {
    query = query.eq('payment_method', method);
    totalsQuery = totalsQuery.eq('payment_method', method);
  }

  const [{ data: payments, count: totalPayments }, { data: totalsRows }] = await Promise.all([
    query,
    totalsQuery,
  ]);

  // Fetch invoice numbers for display (single batch query)
  const invoiceIds = [...new Set((payments ?? []).map((p) => p.invoice_id).filter(Boolean))];
  const enquiryIds = [...new Set((payments ?? []).map((p) => p.enquiry_id).filter(Boolean))];

  const [invoicesRes, enquiriesRes] = await Promise.all([
    invoiceIds.length > 0
      ? supabase.from('invoices').select('id, invoice_number, total_amount').in('id', invoiceIds)
      : { data: [] },
    enquiryIds.length > 0
      ? supabase.from('enquiries').select('id, name, customer_id').in('id', enquiryIds)
      : { data: [] },
  ]);

  const invoiceMap = new Map((invoicesRes.data ?? []).map((i) => [i.id, i]));
  const enquiryMap = new Map((enquiriesRes.data ?? []).map((e) => [e.id, e]));

  // Financial summary from verified payments only
  const allForTotals   = totalsRows ?? [];
  const verifiedPayments = allForTotals.filter((p) => p.status === 'VERIFIED');
  const totalVerified  = verifiedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending   = allForTotals.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
  const totalRejected  = allForTotals.filter((p) => p.status === 'REJECTED').reduce((s, p) => s + Number(p.amount), 0);

  // Filter by customer name/invoice number search
  const filteredPayments = q
    ? (payments ?? []).filter((p) => {
        const inv     = invoiceMap.get(p.invoice_id ?? '');
        const enq     = enquiryMap.get(p.enquiry_id ?? '');
        const search  = q.toLowerCase();
        return (
          inv?.invoice_number?.toLowerCase().includes(search) ||
          enq?.name?.toLowerCase().includes(search) ||
          p.transaction_reference?.toLowerCase().includes(search)
        );
      })
    : (payments ?? []);

  const buildHref = (key: string, val: string) => {
    const base = { status, method, q };
    const updated = { ...base, [key]: val };
    const parts = Object.entries(updated)
      .filter(([, v]) => v && v !== 'all' && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
    return `/admin/payments${parts.length ? '?' + parts.join('&') : ''}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
            Payments
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            All payment records — Amount Received = VERIFIED payments only
          </p>
        </div>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <p className="font-body text-xs text-[var(--color-brown-400)] uppercase tracking-wide mb-1">Verified (Received)</p>
          <p className="font-display text-xl font-bold text-green-700">{fmt(totalVerified)}</p>
          <p className="font-body text-[10px] text-[var(--color-brown-400)] mt-0.5">{verifiedPayments.length} payments</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
          <p className="font-body text-xs text-[var(--color-brown-400)] uppercase tracking-wide mb-1">Pending Verification</p>
          <p className="font-display text-xl font-bold text-yellow-700">{fmt(totalPending)}</p>
          <p className="font-body text-[10px] text-yellow-600 mt-0.5">Not counted as received</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <p className="font-body text-xs text-[var(--color-brown-400)] uppercase tracking-wide mb-1">Rejected</p>
          <p className="font-display text-xl font-bold text-red-600">{fmt(totalRejected)}</p>
          <p className="font-body text-[10px] text-[var(--color-brown-400)] mt-0.5">Excluded from totals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-3 md:p-4 mb-6 space-y-3">
        {/* Search */}
        <form method="GET">
          {status && <input type="hidden" name="status" value={status} />}
          {method && <input type="hidden" name="method" value={method} />}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by customer, invoice #, or transaction reference…"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] min-h-[44px]"
          />
        </form>

        {/* Status filter */}
        <div className="overflow-x-auto -mx-3 px-3">
          <div className="flex gap-2 pb-1 min-w-max">
            {[['all', 'All'], ['PENDING', 'Pending'], ['VERIFIED', 'Verified'], ['REJECTED', 'Rejected']].map(([val, label]) => (
              <Link
                key={val}
                href={buildHref('status', val)}
                className={`px-3 py-2 rounded-lg font-body text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] flex items-center ${
                  (!status || status === 'all') && val === 'all'
                    ? 'text-white bg-[var(--color-green-800)]'
                    : status === val
                    ? 'text-white bg-[var(--color-green-800)]'
                    : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Method filter */}
        <div className="flex flex-wrap gap-2">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brown-400)] self-center">Method:</span>
          {[['all', 'All'], ['UPI', '📱 UPI'], ['CASH', '💵 Cash'], ['BANK_TRANSFER', '🏦 Bank Transfer'], ['CHEQUE', '📝 Cheque']].map(([val, label]) => (
            <Link
              key={val}
              href={buildHref('method', val)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-colors min-h-[32px] flex items-center ${
                (!method || method === 'all') && val === 'all'
                  ? 'text-white bg-[var(--color-green-800)]'
                  : method === val
                  ? 'text-white bg-[var(--color-green-800)]'
                  : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)]">
          <p className="font-body text-xs text-[var(--color-brown-500)]">
            Showing {filteredPayments.length} payments
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Date', 'Customer', 'Invoice', 'Type', 'Method', 'Amount', 'Reference', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-200)]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const inv     = invoiceMap.get(p.invoice_id ?? '');
                  const enq     = enquiryMap.get(p.enquiry_id ?? '');
                  const psColor = PAYMENT_STATUS_COLORS[p.status as PaymentStatusType] ?? 'bg-gray-100 text-gray-600';
                  const psLabel = PAYMENT_STATUS_LABELS[p.status as PaymentStatusType] ?? p.status;
                  const StatusIcon = STATUS_ICON[p.status as PaymentStatusType] ?? Clock;

                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-ivory-100)] transition-colors group">
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)] whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {enq?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {inv ? (
                          <span className="font-body text-sm font-semibold text-[var(--color-green-800)]">
                            {inv.invoice_number}
                          </span>
                        ) : (
                          <span className="font-body text-xs text-[var(--color-brown-400)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-600)]">
                        {PAYMENT_TYPE_LABELS[p.payment_type as PaymentType] ?? p.payment_type}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        {PAYMENT_METHOD_ICONS[p.payment_method as PaymentMethodType] ?? ''}{' '}
                        {PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethodType] ?? p.payment_method}
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-bold text-[var(--color-brown-900)]">
                        {fmt(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)]">
                        {p.transaction_reference ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-semibold border ${psColor}`}>
                          <StatusIcon size={11} />
                          {psLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.enquiry_id && (
                          <Link
                            href={`/admin/enquiries/${p.enquiry_id}`}
                            className="font-body text-xs font-semibold text-[var(--color-green-800)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline flex items-center gap-1"
                          >
                            View <ArrowRight size={11} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] p-8 text-center">
            <p className="font-body text-sm text-[var(--color-brown-400)]">No payments found.</p>
          </div>
        ) : (
          filteredPayments.map((p) => {
            const inv     = invoiceMap.get(p.invoice_id ?? '');
            const enq     = enquiryMap.get(p.enquiry_id ?? '');
            const psColor = PAYMENT_STATUS_COLORS[p.status as PaymentStatusType] ?? 'bg-gray-100 text-gray-600';
            const psLabel = PAYMENT_STATUS_LABELS[p.status as PaymentStatusType] ?? p.status;

            return (
              <div key={p.id} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {enq?.name ?? '—'}
                    </p>
                    <p className="font-body text-xs text-[var(--color-brown-500)]">
                      {inv?.invoice_number ?? '—'} · {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-[var(--color-brown-900)]">{fmt(Number(p.amount))}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-[10px] font-semibold border ${psColor}`}>
                      {psLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-brown-500)]">
                  <span>
                    {PAYMENT_METHOD_ICONS[p.payment_method as PaymentMethodType] ?? ''}{' '}
                    {PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethodType] ?? p.payment_method}
                    {p.transaction_reference ? ` · ${p.transaction_reference}` : ''}
                  </span>
                  {p.enquiry_id && (
                    <Link
                      href={`/admin/enquiries/${p.enquiry_id}`}
                      className="font-body text-xs font-semibold text-[var(--color-green-800)] hover:underline flex items-center gap-1"
                    >
                      View <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {paginate && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={totalPayments ?? 0}
          basePath="/admin/payments"
          params={{ status, method }}
        />
      )}
    </div>
  );
}
