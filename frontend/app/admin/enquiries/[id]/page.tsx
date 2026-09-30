// app/admin/enquiries/[id]/page.tsx — Enquiry detail page

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Calendar, MapPin, Users, FileText } from 'lucide-react';
import StatusUpdater from '@/components/admin/StatusUpdater';
import ActivityTimeline from '@/components/admin/ActivityTimeline';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

const infoCard = (icon: React.ReactNode, label: string, value: string | null) =>
  value ? (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-ivory-200)] text-[var(--color-brown-500)] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-body text-xs text-[var(--color-brown-400)] mb-0.5">{label}</p>
        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">{value}</p>
      </div>
    </div>
  ) : null;

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: enq, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !enq) notFound();

  // Fetch status history
  const { data: history } = await supabase
    .from('enquiry_status_history')
    .select('*')
    .eq('enquiry_id', id)
    .order('created_at', { ascending: false });

  const waUrl = buildWhatsAppUrl(
    `Hi ${enq.name}! Regarding your enquiry for ${enq.event_type || 'your event'} on ${enq.event_date || 'the requested date'} — `
  );

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/enquiries"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Enquiries
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left — main info */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-1 truncate">
                  {enq.name}
                </h1>
                <p className="font-body text-xs md:text-sm text-[var(--color-brown-500)]">
                  Enquiry #{enq.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <StatusUpdater enquiryId={enq.id} currentStatus={enq.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {infoCard(<Phone size={16} />, 'Phone', enq.phone)}
              {infoCard(<Calendar size={16} />, 'Event Date', enq.event_date ? new Date(enq.event_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null)}
              {infoCard(<Users size={16} />, 'Guest Count', enq.guest_count)}
              {infoCard(<MapPin size={16} />, 'Event Location', enq.event_location)}
              {infoCard(
                <span className="text-xs">🎉</span>,
                'Event Type',
                enq.event_type
              )}
              {infoCard(
                <span className="text-xs">🍛</span>,
                'Food Type',
                enq.food_type
              )}
            </div>

            {(enq.custom_items || enq.message) && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[var(--color-ivory-300)] space-y-4">
                {enq.custom_items && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1">
                      Special Food Requests
                    </p>
                    <p className="font-body text-sm text-[var(--color-brown-800)]">{enq.custom_items}</p>
                  </div>
                )}
                {enq.message && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1">
                      Message
                    </p>
                    <p className="font-body text-sm text-[var(--color-brown-800)] whitespace-pre-wrap">{enq.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
            <h2 className="font-display text-base md:text-lg font-bold text-[var(--color-brown-900)] mb-3 md:mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:${enq.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-[var(--color-green-900)] bg-[var(--color-green-100)] hover:bg-[var(--color-green-200)] transition-colors min-h-[44px]"
              >
                <Phone size={18} /> Call Customer
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors min-h-[44px]"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <Link
                href={`/admin/enquiries/${enq.id}/invoice`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-700)] transition-colors min-h-[44px]"
              >
                <FileText size={18} /> Create Invoice
              </Link>
            </div>
          </div>
        </div>

        {/* Right — timeline + metadata */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">
              Activity Timeline
            </h2>
            <ActivityTimeline entries={(history as any[]) ?? []} />
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">
              Metadata
            </h2>
            <div className="space-y-2 font-body text-xs text-[var(--color-brown-500)]">
              <div className="flex justify-between">
                <span>Received</span>
                <span>{new Date(enq.created_at).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{enq.updated_at ? new Date(enq.updated_at).toLocaleString('en-IN') : '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>ID</span>
                <span className="font-mono text-[10px] truncate">{enq.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
