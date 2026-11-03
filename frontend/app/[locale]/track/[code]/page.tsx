// app/[locale]/track/[code]/page.tsx — B13: Public enquiry status lookup
//
// Customers get an 8-character tracking code when they submit an enquiry.
// This page lets them check the status without logging in.
//
// PRIVACY: the query runs through the server-only service-role client, but the
// page returns a deliberately trimmed projection — status, event summary, and
// the last update time. It never exposes phone, address, message, internal
// notes, or the customer record.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_DOT_COLORS, type EnquiryStatus } from '@/types/enquiry';

// Statuses shown to the customer in order (CANCELLED handled separately).
const PUBLIC_FLOW: EnquiryStatus[] = [
  'NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED',
];

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { code } = await params;
  const trackingCode = code.trim().toUpperCase();

  // Basic shape guard before hitting the DB.
  if (!/^[A-Z0-9]{6,12}$/.test(trackingCode)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: enquiry, error } = await supabase
    .from('enquiries')
    .select('id, tracking_code, name, status, event_type, event_date, updated_at')
    .eq('tracking_code', trackingCode)
    .maybeSingle();

  if (error || !enquiry) {
    notFound();
  }

  const status = enquiry.status as EnquiryStatus;
  const isCancelled = status === 'CANCELLED';
  const currentIndex = PUBLIC_FLOW.indexOf(status);

  return (
    <main className="min-h-screen bg-[var(--color-ivory-200)] px-5 py-16">
      <div className="w-full max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-3">
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
            Track Your Enquiry
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-brown-900)] mb-2">
            {enquiry.name ? `${enquiry.name.split(' ')[0]}'s Enquiry` : 'Your Enquiry'}
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">
            Code <span className="font-mono font-bold text-[var(--color-green-800)]">{enquiry.tracking_code}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] shadow-sm p-6 md:p-8">

          {/* Current status badge */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--color-ivory-300)]">
            <span className={`inline-block w-3 h-3 rounded-full ${ENQUIRY_STATUS_DOT_COLORS[status]}`} />
            <div>
              <p className="font-body text-xs text-[var(--color-brown-500)]">Current status</p>
              <p className="font-display text-xl font-bold text-[var(--color-brown-900)]">
                {ENQUIRY_STATUS_LABELS[status]}
              </p>
            </div>
          </div>

          {/* Progress flow (hidden for cancelled) */}
          {!isCancelled && (
            <ol className="space-y-0 mb-6">
              {PUBLIC_FLOW.map((s, i) => {
                const done = i <= currentIndex;
                return (
                  <li key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          done
                            ? 'bg-[var(--color-green-800)] text-white'
                            : 'bg-[var(--color-ivory-300)] text-[var(--color-brown-400)]'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      {i < PUBLIC_FLOW.length - 1 && (
                        <div className={`w-px flex-1 min-h-[20px] ${i < currentIndex ? 'bg-[var(--color-green-800)]' : 'bg-[var(--color-ivory-300)]'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`font-body text-sm font-semibold ${done ? 'text-[var(--color-brown-900)]' : 'text-[var(--color-brown-400)]'}`}>
                        {ENQUIRY_STATUS_LABELS[s]}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Cancelled notice */}
          {isCancelled && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
              <p className="font-body text-sm text-red-700">
                This enquiry has been cancelled. If you think this is a mistake, please
                call us and we&apos;ll be happy to help.
              </p>
            </div>
          )}

          {/* Event summary */}
          {(enquiry.event_type || enquiry.event_date) && (
            <div className="rounded-xl bg-[var(--color-ivory-100)] border border-[var(--color-ivory-300)] p-4 space-y-2">
              {enquiry.event_type && (
                <div className="flex justify-between text-sm">
                  <span className="font-body text-[var(--color-brown-500)]">Event</span>
                  <span className="font-body font-semibold text-[var(--color-brown-900)]">{enquiry.event_type}</span>
                </div>
              )}
              {enquiry.event_date && (
                <div className="flex justify-between text-sm">
                  <span className="font-body text-[var(--color-brown-500)]">Event date</span>
                  <span className="font-body font-semibold text-[var(--color-brown-900)]">{formatDate(enquiry.event_date)}</span>
                </div>
              )}
            </div>
          )}

          <p className="font-body text-xs text-[var(--color-brown-400)] mt-4">
            Last updated {formatDate(enquiry.updated_at)}
          </p>
        </div>

        {/* Help */}
        <div className="bg-[var(--color-ivory-100)] rounded-xl border border-[var(--color-ivory-300)] p-4 mt-6 text-center">
          <p className="font-body text-xs text-[var(--color-brown-500)] mb-2">
            Questions about your quote?
          </p>
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#25D366] hover:underline"
          >
            Message us on WhatsApp →
          </a>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 h-12 rounded-md font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
