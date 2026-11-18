'use client';

// components/layout/LanguageSwitcher.tsx — Tamil ⇄ English.
// A real link (crawlable, works without JS, keeps the current page): swaps the
// locale segment of the current path.

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations('Site.nav');
  const pathname = usePathname() || `/${locale}`;
  const nextLocale = locale === 'ta' ? 'en' : 'ta';

  const segments = pathname.split('/');
  segments[1] = nextLocale; // /ta/... ⇄ /en/...
  const href = segments.join('/') || `/${nextLocale}`;

  return (
    <Link
      href={href}
      hrefLang={nextLocale}
      lang={nextLocale}
      aria-label={t('switchLabel')}
      className={`inline-flex min-h-[44px] items-center rounded-full px-3.5 text-[0.95rem] font-semibold text-[var(--site-leaf)] transition-colors hover:bg-[var(--site-paper-deep)] ${className}`}
    >
      {t('switchTo')}
    </Link>
  );
}
