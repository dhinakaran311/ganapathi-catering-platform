// app/admin/customers/page.tsx — E40: Customer list page

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import DeleteCustomerButton from '@/components/admin/DeleteCustomerButton';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('customers')
    .select('id, name, phone, total_orders, last_order_date, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: customers } = await query;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
            Customers
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            Repeat customers and their event history
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-3 md:p-4 mb-6">
        <form method="GET">
          <input
            id="customer-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name or phone…"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-sm text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)]"
          />
        </form>
      </div>

      {/* Desktop: Table view */}
      <div className="hidden lg:block bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Customers list">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Name', 'Phone', 'Total Events', 'Last Event', 'Since', ''].map((h) => (
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
              {!customers || customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No customers found{q ? ` matching "${q}"` : ''}.
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                    <td className="px-4 py-3 font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      <a href={`tel:${c.phone}`} className="hover:text-[var(--color-green-700)] transition-colors flex items-center gap-1">
                        <Phone size={12} /> {c.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-body text-sm font-bold text-white" style={{ backgroundColor: 'var(--color-green-800)' }}>
                        {c.total_orders ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-400)]">
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs font-medium text-[var(--color-green-700)] bg-[var(--color-green-50)] hover:bg-[var(--color-green-100)] transition-colors"
                        >
                          View <ArrowRight size={12} />
                        </Link>
                        <DeleteCustomerButton id={c.id} name={c.name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Card view */}
      <div className="lg:hidden space-y-3">
        {!customers || customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-8 text-center">
            <p className="font-body text-sm text-[var(--color-brown-400)]">
              No customers found{q ? ` matching "${q}"` : ''}.
            </p>
          </div>
        ) : (
          customers.map((c: any) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* Header: Name + Event count badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-body text-base font-semibold text-[var(--color-brown-900)] truncate">
                    {c.name}
                  </h3>
                </div>
                <div className="flex flex-col items-center ml-3 flex-shrink-0">
                  <span 
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full font-body text-sm font-bold text-white" 
                    style={{ backgroundColor: 'var(--color-green-800)' }}
                  >
                    {c.total_orders ?? 0}
                  </span>
                  <span className="font-body text-xs text-[var(--color-brown-400)] mt-1">
                    Events
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Phone</span>
                  <a 
                    href={`tel:${c.phone}`}
                    className="font-body font-medium text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors flex items-center gap-1"
                  >
                    <Phone size={14} /> {c.phone}
                  </a>
                </div>
                <div>
                  <span className="font-body text-xs text-[var(--color-brown-400)] block mb-0.5">Last Event</span>
                  <span className="font-body font-medium text-[var(--color-brown-900)] block">
                    {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-brown-400)] mb-3 pb-3 border-b border-[var(--color-ivory-200)]">
                Customer since {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--color-green-800)] text-white font-body text-sm font-semibold hover:bg-[var(--color-green-900)] transition-colors min-h-[44px]"
                >
                  View Profile <ArrowRight size={16} />
                </Link>
                <div className="flex-shrink-0 flex items-center justify-center w-[44px] h-[44px] rounded-lg border border-[var(--color-ivory-300)]">
                  <DeleteCustomerButton id={c.id} name={c.name} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
