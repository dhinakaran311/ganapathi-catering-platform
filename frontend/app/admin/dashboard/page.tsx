// app/admin/dashboard/page.tsx — E33: Main admin dashboard
// Real-time stats from Supabase + recent enquiries fed from the public contact form

import { Suspense } from 'react';
import Link from 'next/link';
import { ClipboardList, Users, TrendingUp, Clock, ArrowRight, IndianRupee, Wifi } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { getDashboardStats, getRecentEnquiries } from '@/lib/analytics/queries';
import { StatsCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';

// Map DB status → display label + colour
const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW:        { label: 'New',        className: 'bg-blue-100 text-blue-800 border-blue-200' },
  CONTACTED:  { label: 'Contacted',  className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  DISCUSSION: { label: 'Discussion', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  QUOTE_SENT: { label: 'Quote Sent', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  FOLLOW_UP:  { label: 'Follow Up',  className: 'bg-purple-100 text-purple-800 border-purple-200' },
  CONFIRMED:  { label: 'Confirmed',  className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED:  { label: 'Completed',  className: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-100 text-red-700 border-red-200' },
};

// Map source → badge text
const SOURCE_BADGE: Record<string, string> = {
  form:      '📝 Form',
  whatsapp:  '💬 WhatsApp',
  phone:     '📞 Phone',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

async function DashboardContent() {
  const [stats, recentEnquiries] = await Promise.all([
    getDashboardStats(),
    getRecentEnquiries(10),
  ]);

  const weeklyTrend =
    stats.enquiriesLastWeek > 0
      ? Math.round(((stats.enquiriesThisWeek - stats.enquiriesLastWeek) / stats.enquiriesLastWeek) * 100)
      : null;

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          id="stat-total-enquiries"
          label="Total Enquiries"
          value={stats.totalEnquiries}
          icon={<ClipboardList size={20} />}
          trend={weeklyTrend}
          accentColor="green"
        />
        <StatsCard
          id="stat-new"
          label="New (Unread)"
          value={stats.newEnquiries}
          icon={<Clock size={20} />}
          trend={null}
          accentColor="gold"
        />
        <StatsCard
          id="stat-confirmed-month"
          label="Confirmed This Month"
          value={stats.confirmedThisMonth}
          icon={<TrendingUp size={20} />}
          trend={null}
          accentColor="brown"
        />
        <StatsCard
          id="stat-revenue"
          label="Total Revenue"
          value={fmt(stats.totalRevenue)}
          icon={<IndianRupee size={20} />}
          trend={null}
          accentColor="green"
        />
      </div>

      {/* Live feed banner */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Wifi size={14} className="text-green-600" />
        <span className="font-body text-xs text-[var(--color-brown-500)]">
          Live feed — enquiries from the public form appear here automatically
        </span>
      </div>

      {/* Recent Enquiries Table */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-ivory-300)]">
          <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)]">
            Recent Enquiries
          </h2>
          <Link
            href="/admin/enquiries"
            className="flex items-center gap-1.5 font-body text-sm font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Recent enquiries">
            <thead className="bg-[var(--color-ivory-100)]">
              <tr>
                {['Name', 'Phone', 'Event', 'Guests', 'Date', 'Source', 'Status', ''].map((h) => (
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
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList size={36} className="text-[var(--color-ivory-400)]" />
                      <p className="font-display text-base font-bold text-[var(--color-brown-600)]">
                        No enquiries yet
                      </p>
                      <p className="font-body text-sm text-[var(--color-brown-400)] max-w-sm">
                        When customers fill the contact form on your website, they appear here instantly.
                        Make sure the Supabase migrations have been run.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentEnquiries.map((enq) => {
                  const statusMeta = STATUS_META[enq.status] ?? STATUS_META.NEW;
                  return (
                    <tr key={enq.id} className="hover:bg-[var(--color-ivory-100)] transition-colors group">
                      <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {enq.name}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        <a href={`tel:${enq.phone}`} className="hover:underline">{enq.phone}</a>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)]">
                        {enq.event_type || '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                        {enq.guest_count || '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)] whitespace-nowrap">
                        {enq.event_date
                          ? new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-xs text-[var(--color-brown-500)]">
                          {SOURCE_BADGE[enq.source] ?? enq.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/enquiries/${enq.id}`}
                          className="font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Open →
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
    </>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Dashboard
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Shri Ganapathi Mess — catering enquiries &amp; revenue overview
        </p>
      </div>

      <Suspense
        fallback={
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
            <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] p-6">
              <table className="w-full">
                <TableSkeleton rows={6} cols={8} />
              </table>
            </div>
          </>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
