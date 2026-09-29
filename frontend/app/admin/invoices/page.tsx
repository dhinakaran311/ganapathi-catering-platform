// app/admin/invoices/page.tsx — Phase 5: All Invoices List

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Plus, CheckCircle, Clock, Send, XCircle } from 'lucide-react';
import type { Invoice, InvoiceData } from '@/types/invoice';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    icon: FileText },
  pending:   { label: 'Pending',   color: 'bg-orange-100 text-orange-700', icon: Clock },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-700',    icon: Send },
  paid:      { label: 'Paid',      color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  // Summary stats
  const total_invoices = invoices?.length ?? 0;
  const paid_invoices = invoices?.filter((i) => i.status === 'paid').length ?? 0;
  const pending_invoices = invoices?.filter((i) => ['pending', 'sent'].includes(i.status)).length ?? 0;
  const total_revenue = invoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount ?? 0), 0) ?? 0;
  const pending_revenue = invoices?.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total_amount ?? 0), 0) ?? 0;

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-brown-900)]">
            Invoices
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)] mt-1">
            All generated invoices — click any row to edit
          </p>
        </div>
        <Link
          href="/admin/enquiries"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors"
        >
          <Plus size={16} /> New Invoice (from Enquiry)
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Invoices', value: total_invoices, sub: 'all time', color: 'text-[var(--color-brown-900)]' },
          { label: 'Paid', value: paid_invoices, sub: `${fmt(total_revenue)} received`, color: 'text-green-700' },
          { label: 'Pending / Sent', value: pending_invoices, sub: `${fmt(pending_revenue)} outstanding`, color: 'text-orange-700' },
          { label: 'Total Revenue', value: fmt(total_revenue), sub: 'from paid invoices', color: 'text-[var(--color-green-800)]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-5">
            <p className="font-body text-xs text-[var(--color-brown-400)] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-body text-xs text-[var(--color-brown-400)] mt-0.5">{s.sub}</p>
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
                  {['Invoice #', 'Customer', 'Event', 'Date', 'Amount', 'Balance', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(invoices as Invoice[]).map((inv) => {
                  const data = inv.invoice_data as InvoiceData;
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const balance = data?.balanceDue ?? (inv.total_amount - (data?.advancePaid ?? 0));
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
                      <td className="px-4 py-4">
                        {balance > 0 ? (
                          <span className="font-body text-sm font-semibold text-orange-600">{fmt(balance)}</span>
                        ) : (
                          <span className="font-body text-sm font-semibold text-green-600">✅ Clear</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs font-semibold ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {inv.enquiry_id && (
                          <Link
                            href={`/admin/enquiries/${inv.enquiry_id}/invoice`}
                            className="font-body text-xs font-semibold text-[var(--color-green-800)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Edit →
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
    </div>
  );
}
