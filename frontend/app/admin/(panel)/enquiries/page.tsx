// app/admin/enquiries/page.tsx — CRM enquiry list with full filters

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_COLORS,
  ENQUIRY_STATUS_LABELS,
  EnquiryStatus,
} from '@/types/enquiry';
import { ENQUIRY_SOURCES, SOURCE_LABELS, type EnquirySource } from '@/types/staff';

interface SearchParams {
  status?: string;
  q?: string;
  source?: string;
  assigned?: string;
  next_action?: string;
  overdue?: string;
}

function buildQueryString(base: Record<string, string | undefined>, override: Record<string, string>) {
  const merged = { ...base, ...override };
  const parts = Object.entries(merged)
    .filter(([, v]) => v && v !== 'all' && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
  return parts.length ? '?' + parts.join('&') : '';
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { status, q, source, assigned, overdue } = params;

  // Fetch role for potential future per-role filtering (unused currently)
  await getCurrentUserWithRole();

  const supabase = createAdminClient();

  // Fetch staff list for assigned filter
  const { data: staffProfiles } = await supabase
    .from('staff_profiles')
    .select('user_id, full_name')
    .eq('is_active', true)
    .order('full_name');

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  authUsers?.users?.forEach((u) => { emailMap[u.id] = u.email ?? ''; });

  const staffList = (staffProfiles ?? []).map((s) => ({
    user_id:   s.user_id,
    label:     s.full_name ?? emailMap[s.user_id] ?? s.user_id,
  }));

  // Build query
  let query = supabase
    .from('enquiries')
    .select(`
      id, name, phone, event_type, guest_count, event_date, status,
      source, created_at, next_action, next_action_date, next_action_done,
      assigned_to
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') query = query.eq('status', status);
  if (source && source !== 'all') query = query.eq('source', source);
  if (assigned && assigned !== 'all') query = query.eq('assigned_to', assigned);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,event_type.ilike.%${q}%`);

  // Overdue filter
  if (overdue === '1') {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .not('next_action_date', 'is', null)
      .eq('next_action_done', false)
      .lt('next_action_date', today);
  }

  const { data: enquiries } = await query;

  const currentParams = { status, q, source, assigned, overdue };

  const filterLink = (key: string, value: string, label: string, isActive: boolean) => (
    <Link
      href={`/admin/enquiries${buildQueryString(currentParams, { [key]: value })}`}
      className={`px-3 py-2 rounded-lg font-body text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] flex items-center ${
        isActive
          ? 'text-white bg-[var(--color-green-800)]'
          : 'text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] hover:bg-[var(--color-ivory-200)]'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
            Enquiries
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            {enquiries?.length ?? 0} enquiries
            {overdue === '1' ? ' — showing overdue follow-ups' : ''}
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-3 md:p-4 mb-6 space-y-3">

        {/* Search */}
        <form method="GET" className="w-full">
          {/* Preserve other filters when searching */}
          {status && <input type="hidden" name="status" value={status} />}
          {source && <input type="hidden" name="source" value={source} />}
          {assigned && <input type="hidden" name="assigned" value={assigned} />}
          {overdue && <input type="hidden" name="overdue" value={overdue} />}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name, phone, or event…"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] min-h-[44px]"
          />
        </form>

        {/* Status filter */}
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1.5 px-0.5">Status</p>
          <div className="overflow-x-auto -mx-3 px-3">
            <div className="flex gap-2 pb-1 min-w-max">
              {filterLink('status', 'all', 'All', !status || status === 'all')}
              {ENQUIRY_STATUSES.map((s) =>
                filterLink('status', s, ENQUIRY_STATUS_LABELS[s], status === s)
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Source + Assigned + Overdue */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--color-ivory-200)]">

          {/* Source */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brown-400)]">Source:</span>
            {filterLink('source', 'all', 'All', !source || source === 'all')}
            {ENQUIRY_SOURCES.map((s) =>
              filterLink('source', s, SOURCE_LABELS[s as EnquirySource], source === s)
            )}
          </div>

          {/* Assigned */}
          {staffList.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brown-400)]">Assigned:</span>
              {filterLink('assigned', 'all', 'All', !assigned || assigned === 'all')}
              {filterLink('assigned', 'none', 'Unassigned', assigned === 'none')}
              {staffList.map((s) =>
                filterLink('assigned', s.user_id, s.label, assigned === s.user_id)
              )}
            </div>
          )}

          {/* Overdue shortcut */}
          <Link
            href={`/admin/enquiries${buildQueryString(currentParams, { overdue: overdue === '1' ? '' : '1' })}`}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs font-semibold transition-colors min-h-[36px] ${
              overdue === '1'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-[var(--color-ivory-100)] text-[var(--color-brown-600)] hover:bg-[var(--color-ivory-200)]'
            }`}
          >
            <AlertCircle size={12} /> Overdue
          </Link>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Enquiries">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Name', 'Phone', 'Event', 'Guests', 'Event Date', 'Source', 'Next Action', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-200)]">
              {!enquiries?.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => {
                  const naDate = enq.next_action_date;
                  const naOverdue = !enq.next_action_done && naDate && new Date(naDate) < new Date(new Date().toDateString());
                  const naDueToday = !enq.next_action_done && naDate && new Date(naDate).toDateString() === new Date().toDateString();

                  return (
                    <tr key={enq.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                      <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">{enq.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        <a href={`tel:${enq.phone}`} className="hover:text-[var(--color-green-700)]">{enq.phone}</a>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)]">{enq.event_type || '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">{enq.guest_count || '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        {enq.event_date ? new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)]">
                        {enq.source ? SOURCE_LABELS[enq.source as EnquirySource] ?? enq.source : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {enq.next_action && !enq.next_action_done ? (
                          <div className={`font-body text-xs ${naOverdue ? 'text-red-600 font-semibold' : naDueToday ? 'text-orange-600 font-semibold' : 'text-[var(--color-brown-500)]'}`}>
                            {enq.next_action.replace(/_/g, ' ')}
                            {naDate && (
                              <span className="block text-[10px] mt-0.5">
                                {naOverdue ? '⚠ ' : naDueToday ? '📅 ' : ''}
                                {new Date(naDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        ) : enq.next_action_done ? (
                          <span className="font-body text-xs text-green-600">✓ Done</span>
                        ) : (
                          <span className="font-body text-xs text-[var(--color-brown-300)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border ${ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/enquiries/${enq.id}`} className="flex items-center gap-1 font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)]" aria-label={`View ${enq.name}`}>
                          View <ArrowRight size={12} />
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {!enquiries?.length ? (
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] p-8 text-center">
            <p className="font-body text-sm text-[var(--color-brown-400)]">No enquiries found.</p>
          </div>
        ) : (
          enquiries.map((enq) => {
            const naDate = enq.next_action_date;
            const naOverdue = !enq.next_action_done && naDate && new Date(naDate) < new Date(new Date().toDateString());
            return (
              <div key={enq.id} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-base font-semibold text-[var(--color-brown-900)] truncate">{enq.name}</h3>
                    <p className="font-body text-sm text-[var(--color-brown-500)] mt-0.5">{enq.event_type || 'Event'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body text-xs font-semibold border flex-shrink-0 ${ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Phone</span>
                    <a href={`tel:${enq.phone}`} className="font-body font-medium text-[var(--color-green-700)] block truncate">{enq.phone}</a>
                  </div>
                  <div>
                    <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Event Date</span>
                    <span className="font-body font-medium text-[var(--color-brown-900)] block">
                      {enq.event_date ? new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </div>
                  {enq.next_action && !enq.next_action_done && (
                    <div className="col-span-2">
                      <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Next Action</span>
                      <span className={`font-body text-xs font-semibold ${naOverdue ? 'text-red-600' : 'text-[var(--color-brown-700)]'}`}>
                        {naOverdue ? '⚠ ' : ''}{enq.next_action.replace(/_/g, ' ')}
                        {naDate && ` · ${new Date(naDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/enquiries/${enq.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--color-green-800)] text-white font-body text-sm font-semibold hover:bg-[var(--color-green-900)] transition-colors min-h-[44px]"
                >
                  View Details <ArrowRight size={16} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
