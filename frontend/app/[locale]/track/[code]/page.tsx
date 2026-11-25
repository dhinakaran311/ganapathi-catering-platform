// app/[locale]/track/[code]/page.tsx — B13: Public enquiry status lookup
//
// Customers get an 8-character tracking code when they submit an enquiry.
// This page lets them check the status without logging in.
//
// PRIVACY: the query runs through the server-only service-role client, but the
// page returns a deliberately trimmed projection — status, event summary, and
// the last update time. It never exposes phone, address, message, internal
// notes, or the customer record. (Query unchanged; page redesigned + translated.)

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EnquiryStatus } from '@/types/enquiry';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

// Statuses shown to the customer in order (CANCELLED handled separately).
const PUBLIC_FLOW: EnquiryStatus[] = [
  'NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED',
];

function formatDate(value: string | null, locale: string): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
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

  const t = await getTranslations('Site.track');
  const status = enquiry.status as EnquiryStatus;
  const isCancelled = status === 'CANCELLED';
  // Internal-only stages map onto the nearest public step.
  const PUBLIC_EQUIV: Partial<Record<EnquiryStatus, EnquiryStatus>> = {
    DISCUSSION: 'CONTACTED', FOLLOW_UP: 'QUOTE_SENT', EVENT_SCHEDULED: 'CONFIRMED',
  };
  const currentIndex = PUBLIC_FLOW.indexOf(PUBLIC_EQUIV[status] ?? status);
  const firstName = enquiry.name ? enquiry.name.split(' ')[0] : '';

  return (
    <>
      <Header />
      <main className="s-section pt-14 md:pt-20">
        <div className="s-container max-w-[820px]">
          <h1 className="s-h2 text-[var(--site-leaf-deep)]">
            {firstName ? t('title', { name: firstName }) : t('titleFallback')}
          </h1>
          <p className="mt-3 text-[1rem] text-[var(--site-ink-soft)]">
            {t('code')} <span className="font-semibold tracking-[0.08em] text-[var(--site-leaf)]">{enquiry.tracking_code}</span>
          </p>

          <div className="mt-10 rounded-[28px] bg-[var(--site-paper-deep)] p-7 md:p-10">
            <p className="text-[0.9rem] font-semibold text-[var(--site-ink-muted)]">{t('current')}</p>
            <p className="s-h3 mt-1 text-[var(--site-leaf-deep)]">{t(`statuses.${status}`)}</p>

            {isCancelled ? (
              <p className="mt-6 rounded-2xl bg-[#F6DDD3] px-5 py-4 text-[1rem] text-[var(--site-chilli)]">{t('cancelled')}</p>
            ) : (
              <ol className="mt-8 space-y-4">
                {PUBLIC_FLOW.map((s, i) => {
                  const done = i <= currentIndex;
                  return (
                    <li key={s} className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className={`h-4 w-4 flex-none rounded-full ${done ? 'bg-[var(--site-leaf)]' : 'bg-[#DCCFB6]'}`}
                      />
                      <span className={`text-[1.05rem] ${done ? 'font-semibold text-[var(--site-ink)]' : 'text-[var(--site-ink-muted)]'}`}>
                        {t(`statuses.${s}`)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {(enquiry.event_type || enquiry.event_date) && (
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {enquiry.event_type && (
                  <div>
                    <dt className="text-[0.88rem] text-[var(--site-ink-muted)]">{t('event')}</dt>
                    <dd className="font-semibold text-[var(--site-ink)]">{enquiry.event_type}</dd>
                  </div>
                )}
                {enquiry.event_date && (
                  <div>
                    <dt className="text-[0.88rem] text-[var(--site-ink-muted)]">{t('date')}</dt>
                    <dd className="font-semibold text-[var(--site-ink)]">{formatDate(enquiry.event_date, locale)}</dd>
                  </div>
                )}
              </dl>
            )}

            <p className="mt-8 text-[0.88rem] text-[var(--site-ink-muted)]">
              {t('updated', { date: formatDate(enquiry.updated_at, locale) })}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="font-semibold text-[var(--site-ink)] sm:mr-3">{t('help')}</p>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-primary s-wa">
              <WhatsAppIcon size={19} />
              {t('whatsapp')}
            </a>
            <Link href={`/${locale}`} className="s-btn s-btn-outline">{t('back')}</Link>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
