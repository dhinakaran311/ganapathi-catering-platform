// app/[locale]/not-found.tsx — Branded, bilingual 404 for the public site.
// Rendered for notFound() calls inside [locale] (e.g. an unknown tracking
// code) and, via the [...rest] catch-all, for any unknown /ta/* or /en/* URL.

import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

export default async function NotFound() {
  const t = await getTranslations('Site.notFound');
  const locale = await getLocale();

  return (
    <>
      <Header />
      <main className="s-section pt-16 md:pt-24">
        <div className="s-container max-w-[820px]">
          <p className="s-figure text-[var(--site-brass)]">404</p>
          <h1 className="s-h2 mt-6 text-[var(--site-leaf-deep)]">{t('title')}</h1>
          <p className="s-lead mt-5">{t('body')}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}`} className="s-btn s-btn-primary">{t('home')}</Link>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-outline">
              <WhatsAppIcon size={19} />
              {t('whatsapp')}
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
