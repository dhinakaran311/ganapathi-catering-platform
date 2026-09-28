// app/admin/customers/[id]/page.tsx — E40: Customer detail page

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Calendar, ClipboardList } from 'lucide-react';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customer) notFound();

  // Fetch related enquiries
  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, event_type, event_date, guest_count, status, created_at')
    .eq('phone', customer.phone)
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — customer info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-display font-bold mb-4"
              style={{ backgroundColor: 'var(--color-green-800)' }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-display text-xl font-bold text-[var(--color-brown-900)] mb-1">
              {customer.name}
            </h1>
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-2 font-body text-sm text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors mb-1"
            >
              <Phone size={14} /> {customer.phone}
            </a>
            {customer.email && (
              <p className="font-body text-sm text-[var(--color-brown-500)]">{customer.email}</p>
            )}

            <div className="mt-6 pt-6 border-t border-[var(--color-ivory-300)] grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-display text-2xl font-bold text-[var(--color-brown-900)]">
                  {customer.total_events ?? 0}
                </p>
                <p className="font-body text-xs text-[var(--color-brown-500)]">Total Events</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-[var(--color-brown-900)]">
                  {customer.last_event_date
                    ? new Date(customer.last_event_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : '—'}
                </p>
                <p className="font-body text-xs text-[var(--color-brown-500)]">Last Event</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — enquiry history */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-ivory-300)] flex items-center gap-2">
              <ClipboardList size={18} className="text-[var(--color-brown-500)]" />
              <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
                Enquiry History
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-ivory-200)]">
              {!enquiries || enquiries.length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-[var(--color-brown-400)]">
                  No enquiries found for this phone number.
                </p>
              ) : (
                (enquiries as any[]).map((enq) => (
                  <Link
                    key={enq.id}
                    href={`/admin/enquiries/${enq.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-ivory-100)] transition-colors"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                        {enq.event_type}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-body text-xs text-[var(--color-brown-500)]">
                          {enq.guest_count} guests
                        </span>
                        {enq.event_date && (
                          <span className="flex items-center gap-1 font-body text-xs text-[var(--color-brown-500)]">
                            <Calendar size={10} />
                            {new Date(enq.event_date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-body text-xs font-semibold capitalize ${
                          statusColors[enq.status] ?? statusColors.pending
                        }`}
                      >
                        {enq.status}
                      </span>
                      <span className="font-body text-xs text-[var(--color-brown-400)]">→</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
