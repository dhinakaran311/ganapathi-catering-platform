// app/admin/dashboard/page.tsx — E33: Main admin dashboard with stats + recent enquiries

import { Suspense } from 'react';
import Link from 'next/link';
import { ClipboardList, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { getDashboardStats, getRecentEnquiries } from '@/lib/analytics/queries';
import { StatsCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';

const statusStyles: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-[var(--color-ivory-300)] text-[var(--color-brown-700)] border-[var(--color-ivory-400)]',
};

async function DashboardContent() {
  const [stats, recentEnquiries] = await Promise.all([
    getDashboardStats(),
    getRecentEnquiries(8),
  ]);

  const weeklyTrend =
    stats.enquiriesLastWeek > 0
      ? Math.round(((stats.enquiriesThisWeek - stats.enquiriesLastWeek) / stats.enquiriesLastWeek) * 100)
      : null;

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          id="stat-total-enquiries"
          label="Total Enquiries"
          value={stats.totalEnquiries}
          icon={<ClipboardList size={20} />}
          trend={weeklyTrend}
          accentColor="green"
        />
        <StatsCard
          id="stat-pending"
          label="Pending"
          value={stats.pendingEnquiries}
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
          id="stat-customers"
          label="Customers"
          value={stats.totalCustomers}
          icon={<Users size={20} />}
          trend={null}
          accentColor="green"
        />
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
                {['Name', 'Phone', 'Event', 'Guests', 'Date', 'Status', ''].map((h) => (
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
                  <td colSpan={7} className="px-4 py-10 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No enquiries yet. They will appear here once customers contact you.
                  </td>
                </tr>
              ) : (
                recentEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                    <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {enq.name}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {enq.phone}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-700)]">
                      {enq.event_type}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {enq.guest_count}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {enq.event_date
                        ? new Date(enq.event_date).toLocaleDateString('en-IN')
                        : '—'}
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
                        className="font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
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
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Dashboard
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Overview of Shri Ganapathi Mess catering enquiries and activity
        </p>
      </div>

      <Suspense
        fallback={
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
            <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] p-6">
              <table className="w-full">
                <TableSkeleton rows={6} cols={7} />
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
