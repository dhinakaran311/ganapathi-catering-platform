// app/[locale]/quote/success/page.tsx — B14: Thank-you page shown after WhatsApp opens

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

export default async function QuoteSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Site.success');

  return (
    <>
      <Header />
      <main className="s-section pt-14 md:pt-20">
        <div className="s-container max-w-[820px]">
          <h1 className="s-display text-[var(--site-leaf-deep)]">{t('title')}</h1>

          <h2 className="s-h3 mt-14 text-[var(--site-brass-text)]">{t('next')}</h2>
          <ol className="mt-6 space-y-6">
            {[t('step1'), t('step2'), t('step3')].map((text, i) => (
              <li key={i} className="flex gap-5">
                <span aria-hidden="true" className="mt-2 h-3 w-3 flex-none rounded-full bg-[var(--site-brass)]" />
                <p className="s-serif text-[1.3rem] leading-snug text-[var(--site-ink)] md:text-[1.5rem]">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-[28px] bg-[var(--site-paper-deep)] p-7 md:p-9">
            <p className="font-semibold text-[var(--site-ink)]">{t('notOpened')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-primary s-wa">
                <WhatsAppIcon size={19} />
                {t('openManually')}
              </a>
              <Link href={`/${locale}`} className="s-btn s-btn-outline">
                {t('back')}
              </Link>
            </div>
            <p className="mt-5 text-[0.95rem] text-[var(--site-ink-muted)]">Shri Ganapathi Mess · {SITE.phoneDisplay}</p>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
