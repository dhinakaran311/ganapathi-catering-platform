// app/admin/events/page.tsx — Events management page
// Uses enquiries with event_date as the event source (no duplicate events table).
// Sections: Upcoming, Today, Completed.
// Links directly to enquiry detail — no duplicate pages.

import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowRight, Calendar, Users, MapPin } from 'lucide-react';
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLORS,
  type EnquiryStatus,
} from '@/types/enquiry';
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_COLORS,
  type InvoicePaymentStatus,
} from '@/types/payment';

interface SearchParams {
  section?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const section = params.section ?? 'upcoming';

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // ── Query based on section ──────────────────────────────────────────────────
  let query = supabase
    .from('enquiries')
    .select(`
      id, name, phone, event_type, event_date, guest_count,
      event_location, status, customer_id
    `)
    .not('event_date', 'is', null)
    .neq('status', 'CANCELLED')
    .order('event_date', { ascending: section !== 'completed' });

  if (section === 'upcoming') {
    query = query.gt('event_date', today).neq('status', 'COMPLETED');
  } else if (section === 'today') {
    query = query.eq('event_date', today).neq('status', 'COMPLETED');
  } else if (section === 'completed') {
    query = query.eq('status', 'COMPLETED').order('event_date', { ascending: false });
  }

  const { data: events } = await query.limit(100);

  // Fetch financial data for all events in one batch
  const enquiryIds = (events ?? []).map((e) => e.id);
  const invoiceSummaries = enquiryIds.length > 0
    ? await supabase
        .from('invoice_payment_summary')
        .select('invoice_id, invoice_number, total_amount, amount_received, balance_due, payment_status')
        .in('invoice_id', (await supabase
          .from('invoices')
          .select('id')
          .in('enquiry_id', enquiryIds)
          .eq('is_deleted', false)
          .neq('status', 'CANCELLED')
          .then((r) => (r.data ?? []).map((i) => i.id))
        ))
    : { data: [] };

  // Map enquiry_id → invoice summary (most recent active invoice)
  const enquiryInvoiceMap = new Map<string, { invoice_number: string; total_amount: number; amount_received: number; balance_due: number; payment_status: string }>();

  if (enquiryIds.length > 0) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, enquiry_id, invoice_number, total_amount, status')
      .in('enquiry_id', enquiryIds)
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    const summaryMap = new Map((invoiceSummaries.data ?? []).map((s) => [s.invoice_id, s]));

    // Group by enquiry_id, pick most recent
    const seenEnquiries = new Set<string>();
    for (const inv of (invoices ?? [])) {
      if (inv.enquiry_id && !seenEnquiries.has(inv.enquiry_id)) {
        seenEnquiries.add(inv.enquiry_id);
        const summary = summaryMap.get(inv.id);
        enquiryInvoiceMap.set(inv.enquiry_id, {
          invoice_number:  inv.invoice_number,
          total_amount:    Number(summary?.total_amount ?? inv.total_amount ?? 0),
          amount_received: Number(summary?.amount_received ?? 0),
          balance_due:     Number(summary?.balance_due ?? inv.total_amount ?? 0),
          payment_status:  summary?.payment_status ?? 'UNPAID',
        });
      }
    }
  }

  const tabs: { key: string; label: string }[] = [
    { key: 'upcoming',  label: '📅 Upcoming' },
    { key: 'today',     label: '🔔 Today' },
    { key: 'completed', label: '✅ Completed' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Events
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Catering events — upcoming, today, and completed
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/events?section=${key}`}
            className={`px-4 py-2.5 rounded-lg font-body text-sm font-semibold transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
              section === key
                ? 'text-white bg-[var(--color-green-800)]'
                : 'text-[var(--color-brown-600)] bg-white border border-[var(--color-ivory-300)] hover:bg-[var(--color-ivory-100)]'
            }`}
          >
            {label}
            {(events?.length ?? 0) > 0 && section === key && (
              <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {events?.length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Date', 'Customer', 'Event Type', 'Guests', 'Location', 'Invoice', 'Received', 'Balance', 'Payment', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-200)]">
              {!events?.length ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No {section} events found.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const fin     = enquiryInvoiceMap.get(ev.id);
                  const psColor = fin ? (INVOICE_PAYMENT_STATUS_COLORS[fin.payment_status as InvoicePaymentStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200') : null;
                  const psLabel = fin ? (INVOICE_PAYMENT_STATUS_LABELS[fin.payment_status as InvoicePaymentStatus] ?? fin.payment_status) : null;
                  const esColor = ENQUIRY_STATUS_COLORS[ev.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200';
                  const esLabel = ENQUIRY_STATUS_LABELS[ev.status as EnquiryStatus] ?? ev.status;
                  const daysUntil = ev.event_date
                    ? Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <tr key={ev.id} className="hover:bg-[var(--color-ivory-100)] transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                          {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        {daysUntil !== null && daysUntil >= 0 && (
                          <p className={`font-body text-[10px] ${daysUntil === 0 ? 'text-orange-600 font-semibold' : daysUntil <= 3 ? 'text-red-500 font-semibold' : 'text-[var(--color-brown-400)]'}`}>
                            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {ev.name}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)]">
                        {ev.event_type ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        {ev.guest_count ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)] max-w-[100px] truncate">
                        {ev.event_location ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-green-800)] font-semibold">
                        {fin?.invoice_number ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-green-700">
                        {fin ? fmt(fin.amount_received) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {fin ? (
                          fin.balance_due > 0
                            ? <span className="font-body text-sm font-semibold text-orange-600">{fmt(fin.balance_due)}</span>
                            : <span className="font-body text-sm text-green-600 font-semibold">✅ Cleared</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {psColor && psLabel ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-semibold border ${psColor}`}>
                            {psLabel}
                          </span>
                        ) : (
                          <span className="font-body text-xs text-[var(--color-brown-400)]">No invoice</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-semibold border ${esColor}`}>
                          {esLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/enquiries/${ev.id}`}
                          className="font-body text-xs font-semibold text-[var(--color-green-800)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline flex items-center gap-1"
                        >
                          Open <ArrowRight size={11} />
                        </Link>
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
      <div className="md:hidden space-y-3">
        {!events?.length ? (
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] p-8 text-center">
            <p className="font-body text-sm text-[var(--color-brown-400)]">No {section} events found.</p>
          </div>
        ) : (
          events.map((ev) => {
            const fin     = enquiryInvoiceMap.get(ev.id);
            const psColor = fin ? (INVOICE_PAYMENT_STATUS_COLORS[fin.payment_status as InvoicePaymentStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200') : null;
            const psLabel = fin ? (INVOICE_PAYMENT_STATUS_LABELS[fin.payment_status as InvoicePaymentStatus] ?? fin.payment_status) : null;
            const daysUntil = ev.event_date
              ? Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <Link
                key={ev.id}
                href={`/admin/enquiries/${ev.id}`}
                className="block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] truncate">{ev.name}</p>
                    <p className="font-body text-xs text-[var(--color-brown-500)]">{ev.event_type ?? 'Event'}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-body text-sm font-bold text-[var(--color-brown-900)]">
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </p>
                    {daysUntil !== null && daysUntil >= 0 && daysUntil <= 3 && (
                      <p className="font-body text-[10px] text-red-500 font-semibold">
                        {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  {ev.guest_count && (
                    <div className="flex items-center gap-1 text-[var(--color-brown-500)]">
                      <Users size={11} /> {ev.guest_count} guests
                    </div>
                  )}
                  {ev.event_location && (
                    <div className="flex items-center gap-1 text-[var(--color-brown-500)] truncate">
                      <MapPin size={11} /> {ev.event_location}
                    </div>
                  )}
                </div>
                {fin && (
                  <div className="flex items-center justify-between text-xs border-t border-[var(--color-ivory-200)] pt-2">
                    <span className="font-body text-[var(--color-brown-600)]">
                      {fin.invoice_number} · {fmt(fin.total_amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      {fin.balance_due > 0 && (
                        <span className="font-body font-semibold text-orange-600">
                          Bal: {fmt(fin.balance_due)}
                        </span>
                      )}
                      {psColor && psLabel && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-[10px] font-semibold border ${psColor}`}>
                          {psLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
