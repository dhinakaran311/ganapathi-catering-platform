// app/admin/reports/page.tsx — E34: Sales reports / analytics page

import { createClient } from '@/lib/supabase/server';
import { getEnquiriesByStatus } from '@/lib/analytics/queries';

async function ReportsContent() {
  const supabase = await createClient();
  const statusCounts = await getEnquiriesByStatus();

  // Get monthly breakdown for the last 6 months
  const { data: monthly } = await supabase
    .from('enquiries')
    .select('created_at, status, event_type')
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Event type breakdown
  const eventCounts: Record<string, number> = {};
  (monthly ?? []).forEach(({ event_type }) => {
    if (event_type) eventCounts[event_type] = (eventCounts[event_type] ?? 0) + 1;
  });

  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = Object.values(eventCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-6">
          Enquiry Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending', key: 'pending', color: '#996B0C' },
            { label: 'Confirmed', key: 'confirmed', color: '#205728' },
            { label: 'Cancelled', key: 'cancelled', color: '#dc2626' },
            { label: 'Completed', key: 'completed', color: '#6B5744' },
          ].map(({ label, key, color }) => (
            <div
              key={key}
              className="rounded-lg border border-[var(--color-ivory-300)] p-4 text-center"
            >
              <p
                className="font-display text-3xl font-bold mb-1"
                style={{ color }}
              >
                {statusCounts[key] ?? 0}
              </p>
              <p className="font-body text-sm text-[var(--color-brown-500)] capitalize">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top event types */}
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
          Analytics & Reports
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Enquiry trends, event type breakdown, and conversion data
        </p>
      </div>
      <ReportsContent />
    </div>
  );
}
