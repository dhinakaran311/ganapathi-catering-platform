// app/admin/enquiries/page.tsx — Enquiries list page with search + filter

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const statusStyles: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-[var(--color-ivory-300)] text-[var(--color-brown-700)] border-[var(--color-ivory-400)]',
};

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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
            Enquiries
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            All customer enquiries from the contact form
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form method="GET" className="flex-1">
          <input
            id="enquiry-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name, phone, or event…"
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-sm text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
          />
        </form>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((s) => (
            <Link
              key={s}
              href={`/admin/enquiries?status=${s}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-2 rounded-lg font-body text-xs font-semibold capitalize transition-colors ${
                (s === 'all' && !status) || status === s
                  ? 'text-white'
                  : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
              }`}
              style={
                (s === 'all' && !status) || status === s
                  ? { backgroundColor: 'var(--color-green-800)' }
                  : {}
              }
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border capitalize ${
                          statusStyles[enq.status] ?? statusStyles.pending
                        }`}
                      >
                        {enq.status}
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
    </div>
  );
}
