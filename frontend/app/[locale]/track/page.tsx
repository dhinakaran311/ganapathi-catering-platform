// app/[locale]/track/page.tsx — "Track your enquiry" entry page.
//
// Customers type the tracking code they got after sending an enquiry and are
// taken to /[locale]/track/<code> (the status page). An unknown code comes
// back here with ?code=…&error=notfound so they can correct it.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import TrackLookupForm from '@/components/site/TrackLookupForm';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Site.trackLookup' });
  return { title: `${t('title')} — ${SITE.nameEn}`, description: t('intro') };
}

export default async function TrackLookupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string | string[]; error?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';
  const code = first(sp.code).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12);
  const notFound = first(sp.error) === 'notfound' && code !== '';
  const t = await getTranslations('Site.trackLookup');

  return (
    <>
      <Header />
      <main className="s-section pt-14 md:pt-20">
        <div className="s-container max-w-[720px]">
          <p className="text-[0.9rem] font-semibold tracking-[0.08em] text-[var(--site-brass-text)]">{t('eyebrow')}</p>
          <h1 className="s-h2 mt-2 text-[var(--site-leaf-deep)]">{t('title')}</h1>
          <p className="mt-4 max-w-[56ch] text-[1.05rem] leading-relaxed text-[var(--site-ink-soft)]">{t('intro')}</p>

          <div className="mt-10 rounded-[28px] bg-[var(--site-paper-deep)] p-7 md:p-10">
            {notFound && (
              <p role="alert" className="rounded-2xl bg-[#F6DDD3] px-5 py-4 text-[1rem] leading-relaxed text-[var(--site-chilli)]">
                {t('notFound', { code })}
              </p>
            )}
            <TrackLookupForm locale={locale} initialCode={code} />
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="font-semibold text-[var(--site-ink)] sm:mr-3">{t('noCode')}</p>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-primary s-wa">
              <WhatsAppIcon size={19} />
              {t('whatsapp')}
            </a>
            <Link href={`/${locale}#contact`} className="s-btn s-btn-outline">{t('newEnquiry')}</Link>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
