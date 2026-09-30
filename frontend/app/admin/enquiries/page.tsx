// app/admin/enquiries/page.tsx — Enquiries list page with search + filter

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_COLORS, ENQUIRY_STATUS_LABELS, EnquiryStatus } from '@/types/enquiry';

interface SearchParams {
  status?: string;
  q?: string;
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('enquiries')
    .select('id, name, phone, event_type, guest_count, event_date, status, created_at')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,event_type.ilike.%${q}%`);
  }

  const { data: enquiries } = await query.limit(50);

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
            Enquiries
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            All customer enquiries from the contact form
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-3 md:p-4 mb-6 space-y-3 max-w-full">
        {/* Search */}
        <form method="GET" className="w-full">
          <input
            id="enquiry-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name, phone, or event…"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-sm text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent min-h-[44px]"
          />
        </form>

        {/* Status filter - Horizontal scroll on mobile */}
        <div className="w-full overflow-x-auto -mx-3 px-3">
          <div className="flex gap-2 pb-2 min-w-max">
            <Link
              href={`/admin/enquiries?status=all${q ? `&q=${q}` : ''}`}
              className={`px-4 py-2.5 rounded-lg font-body text-xs font-semibold transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
                !status || status === 'all'
                  ? 'text-white'
                  : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
              }`}
              style={
                !status || status === 'all'
                  ? { backgroundColor: 'var(--color-green-800)' }
                  : {}
              }
            >
              All
            </Link>
            {ENQUIRY_STATUSES.map((s) => (
              <Link
                key={s}
                href={`/admin/enquiries?status=${s}${q ? `&q=${q}` : ''}`}
                className={`px-4 py-2.5 rounded-lg font-body text-xs font-semibold transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
                  status === s
                    ? 'text-white'
                    : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
                }`}
                style={
                  status === s
                    ? { backgroundColor: 'var(--color-green-800)' }
                    : {}
                }
              >
                {ENQUIRY_STATUS_LABELS[s]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Table view */}
      <div className="hidden lg:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full" aria-label="All enquiries">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Name', 'Phone', 'Event', 'Guests', 'Event Date', 'Received', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-200)]">
              {!enquiries || enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No enquiries found
                    {status && status !== 'all' ? ` with status "${status}"` : ''}
                    {q ? ` matching "${q}"` : ''}.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq: any) => (
                  <tr key={enq.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                    <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {enq.name}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      <a href={`tel:${enq.phone}`} className="hover:text-[var(--color-green-700)] transition-colors">
                        {enq.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)]">
                      {enq.event_type}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {enq.guest_count}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {enq.event_date ? new Date(enq.event_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)]">
                      {new Date(enq.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border ${
                          ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/enquiries/${enq.id}`}
                        className="flex items-center gap-1 font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors"
                        aria-label={`View enquiry from ${enq.name}`}
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Card view */}
      <div className="lg:hidden space-y-3 max-w-full">
        {!enquiries || enquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-8 text-center max-w-full">
            <p className="font-body text-sm text-[var(--color-brown-400)]">
              No enquiries found
              {status && status !== 'all' ? ` with status "${status}"` : ''}
              {q ? ` matching "${q}"` : ''}.
            </p>
          </div>
        ) : (
          enquiries.map((enq: any) => (
            <div
              key={enq.id}
              className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 hover:shadow-md transition-shadow max-w-full"
            >
              {/* Header: Name + Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-body text-base font-semibold text-[var(--color-brown-900)] truncate">
                    {enq.name}
                  </h3>
                  <p className="font-body text-sm text-[var(--color-brown-500)] mt-0.5 truncate">
                    {enq.event_type || 'Event'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full font-body text-xs font-semibold border ml-2 flex-shrink-0 ${
                    ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Phone</span>
                  <a 
                    href={`tel:${enq.phone}`}
                    className="font-body font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors block truncate"
                  >
                    {enq.phone}
                  </a>
                </div>
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Guests</span>
                  <span className="font-body font-medium text-[var(--color-brown-900)] block">
                    {enq.guest_count || '—'}
                  </span>
                </div>
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Event Date</span>
                  <span className="font-body font-medium text-[var(--color-brown-900)] block">
                    {enq.event_date ? new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                </div>
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Received</span>
                  <span className="font-body font-medium text-[var(--color-brown-900)] block">
                    {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* View Button */}
              <Link
                href={`/admin/enquiries/${enq.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--color-green-800)] text-white font-body text-sm font-semibold hover:bg-[var(--color-green-900)] transition-colors min-h-[44px]"
                aria-label={`View enquiry from ${enq.name}`}
              >
                View Details <ArrowRight size={16} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
