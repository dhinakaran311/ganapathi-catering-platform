// components/home/Hero.tsx — Public hero.
// Editorial split: the headline (LCP, server-rendered) on the left, the
// interactive 3D tiffin (lazy, client) standing in an arch on the right.

import { useLocale, useTranslations } from 'next-intl';
import TiffinShowcase from '@/components/site/TiffinShowcase';
import TrackedLink from '@/components/site/TrackedLink';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

export default function Hero() {
  const t = useTranslations('Hero');
  const s = useTranslations('Site.hero');
  const locale = useLocale();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 lg:pt-20"
    >
      <div className="s-container grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
        <div className="max-w-[720px]">
          <h1
            id="hero-title"
            className={`s-display whitespace-pre-line text-[var(--site-leaf-deep)] ${
              locale === 'ta' ? '!text-[clamp(2.1rem,4.3vw,3.8rem)]' : '!text-[clamp(2.5rem,5.2vw,4.6rem)]'
            }`}
          >
            {s('title')}
          </h1>

          {/* Bilingual echo of the headline. Tamil has no true italic, so it
              stays upright; the English echo (on the Tamil site) is italic. */}
          <p
            lang={locale === 'ta' ? 'en' : 'ta'}
            className={`s-serif mt-5 text-lg text-[var(--site-brass-text)] md:text-xl ${locale === 'ta' ? 'italic' : ''}`}
          >
            {s('echo')}
          </p>

          <p className="s-lead mt-7">{t('description')}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              event="whatsapp_open"
              source="hero"
              className="s-btn s-btn-primary"
            >
              <WhatsAppIcon size={20} />
              {t('whatsappBtn')}
            </TrackedLink>
            <a href="#contact" className="s-btn s-btn-outline">
              {t('quoteBtn')}
            </a>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-y-3 text-[0.95rem] sm:grid-cols-3 sm:gap-x-8">
            {[s('factYears'), s('factGuests'), s('factArea')].map((fact) => (
              <li key={fact} className="flex items-baseline gap-3 font-semibold text-[var(--site-ink)]">
                <span aria-hidden="true" className="inline-block h-2 w-2 flex-none -translate-y-0.5 rounded-full bg-[var(--site-brass)]" />
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <TiffinShowcase />
      </div>
    </section>
  );
}
