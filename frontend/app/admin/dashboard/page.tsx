// app/admin/dashboard/page.tsx — E33: Main admin dashboard
// Real-time stats from Supabase + recent enquiries fed from the public contact form

import { Suspense } from 'react';
import Link from 'next/link';
import { ClipboardList, TrendingUp, Clock, ArrowRight, IndianRupee, Wifi, AlertCircle, Bell } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { getDashboardStats, getRecentEnquiries, getFollowupSummary } from '@/lib/analytics/queries';
import { StatsCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ENQUIRY_STATUS_COLORS, ENQUIRY_STATUS_LABELS, EnquiryStatus } from '@/types/enquiry';

// Map source → badge text
const SOURCE_BADGE: Record<string, string> = {
  form:      '📝 Form',
  whatsapp:  '💬 WhatsApp',
  phone:     '📞 Phone',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

async function DashboardContent() {
  const [stats, recentEnquiries, followup] = await Promise.all([
    getDashboardStats(),
    getRecentEnquiries(10),
    getFollowupSummary(),
  ]);

  const weeklyTrend =
    stats.enquiriesLastWeek > 0
      ? Math.round(((stats.enquiriesThisWeek - stats.enquiriesLastWeek) / stats.enquiriesLastWeek) * 100)
      : null;

  return (
    <>
      {/* Stats Grid — Row 1: Enquiry stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
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
          id="stat-customers"
          label="Total Customers"
          value={stats.totalCustomers}
          icon={<ClipboardList size={20} />}
          trend={null}
          accentColor="green"
        />
      </div>

      {/* Stats Grid — Row 2: Financial stats (from verified payments) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatsCard
          id="stat-total-invoiced"
          label="Total Invoiced"
          value={fmt(stats.totalInvoiced)}
          icon={<IndianRupee size={20} />}
          trend={null}
          accentColor="brown"
        />
        <StatsCard
          id="stat-received"
          label="Amount Received"
          value={fmt(stats.totalReceived)}
          icon={<IndianRupee size={20} />}
          trend={null}
          accentColor="green"
        />
        <StatsCard
          id="stat-outstanding"
          label="Outstanding"
          value={fmt(stats.totalOutstanding)}
          icon={<AlertCircle size={20} />}
          trend={null}
          accentColor="gold"
        />
      </div>

      {/* Follow-up Widget */}
      {(followup.overdue > 0 || followup.due_today > 0 || followup.upcoming > 0) && (
        <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[var(--color-brown-600)]" />
              <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">Follow-ups</h2>
            </div>
            <Link
              href="/admin/enquiries?overdue=1"
              className="font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)]"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/admin/enquiries?overdue=1" className="group rounded-xl border border-red-200 bg-red-50 p-3 text-center hover:bg-red-100 transition-colors">
              <p className="font-display text-2xl font-bold text-red-600">{followup.overdue}</p>
              <p className="font-body text-xs text-red-500 mt-0.5">Overdue</p>
            </Link>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-center">
              <p className="font-display text-2xl font-bold text-orange-600">{followup.due_today}</p>
              <p className="font-body text-xs text-orange-500 mt-0.5">Due Today</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="font-display text-2xl font-bold text-blue-600">{followup.upcoming}</p>
              <p className="font-body text-xs text-blue-500 mt-0.5">Upcoming</p>
            </div>
          </div>
        </div>
      )}

      {/* Live feed banner */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Wifi size={14} className="text-green-600" />
        <span className="font-body text-xs text-[var(--color-brown-500)]">
          Live feed — enquiries from the public form appear here automatically
        </span>
      </div>

      {/* Recent Enquiries - Desktop: Table view */}
      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
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
                  const statusColor = ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200';
                  const statusLabel = ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status;
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border ${statusColor}`}>
                          {statusLabel}
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

      {/* Recent Enquiries - Mobile: Simplified card list */}
      <div className="md:hidden bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-ivory-300)]">
          <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            Recent Enquiries
          </h2>
          <Link
            href="/admin/enquiries"
            className="flex items-center gap-1 font-body text-xs font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-[var(--color-ivory-200)]">
          {recentEnquiries.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <ClipboardList size={32} className="text-[var(--color-ivory-400)] mx-auto mb-2" />
              <p className="font-display text-sm font-bold text-[var(--color-brown-600)] mb-1">
                No enquiries yet
              </p>
              <p className="font-body text-xs text-[var(--color-brown-400)]">
                Contact form submissions will appear here
              </p>
            </div>
          ) : (
            recentEnquiries.map((enq) => {
              const statusColor = ENQUIRY_STATUS_COLORS[enq.status as EnquiryStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200';
              const statusLabel = ENQUIRY_STATUS_LABELS[enq.status as EnquiryStatus] ?? enq.status;
              return (
                <Link
                  key={enq.id}
                  href={`/admin/enquiries/${enq.id}`}
                  className="block px-4 py-3 hover:bg-[var(--color-ivory-100)] transition-colors active:bg-[var(--color-ivory-200)]"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="font-body text-sm font-semibold text-[var(--color-brown-900)] block truncate">
                        {enq.name}
                      </span>
                      <span className="font-body text-xs text-[var(--color-brown-500)]">
                        {enq.event_type || 'Event'}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-semibold border ml-2 flex-shrink-0 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-brown-500)]">
                    <span>{enq.guest_count || '—'} guests</span>
                    <span>•</span>
                    <span>
                      {enq.event_date
                        ? new Date(enq.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : '—'}
                    </span>
                    {SOURCE_BADGE[enq.source] && (
                      <>
                        <span>•</span>
                        <span>{SOURCE_BADGE[enq.source]}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })
          )}
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
