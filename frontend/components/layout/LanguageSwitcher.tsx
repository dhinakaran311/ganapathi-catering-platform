'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ta' ? 'en' : 'ta';
    // Swap the locale prefix in the current path
    const segments = pathname.split('/');
    segments[1] = nextLocale; // index 1 is the locale segment: /ta/... or /en/...
    router.push(segments.join('/') || `/${nextLocale}`);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[var(--color-green-800)] text-[var(--color-green-800)] font-medium text-sm hover:bg-[var(--color-green-50)] transition-colors active:scale-95"
      aria-label={locale === 'ta' ? 'Switch to English' : 'தமிழில் மாற்றுக'}
    >
      <span aria-hidden="true" className="text-base">🌐</span>
      <span className="min-w-[40px] text-center tracking-wider">
        {locale === 'ta' ? 'EN' : 'தமிழ்'}
      </span>
    </button>
  );
}
