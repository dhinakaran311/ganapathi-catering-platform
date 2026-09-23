'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  
  return (
    <header className="sticky top-0 z-50 h-[var(--spacing-nav-mobile)] md:h-[var(--spacing-nav)] bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-400)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12 h-full flex items-center justify-between">
        
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3 flex-shrink-0">
          <Image
            src="/logos/logo-512.png"
            alt="Sri Ganapathi Mess Logo"
            width={56}
            height={56}
            className="w-12 h-12 md:w-14 md:h-14 object-contain"
          />
          <div className="flex flex-col gap-px">
            <span className="font-tamil text-sm font-bold text-[var(--color-green-800)] leading-tight">
              ஸ்ரீ கணபதி மெஸ்
            </span>
            <span className="font-display text-xs font-semibold text-[var(--color-gold-700)] tracking-widest uppercase leading-tight">
              Tiruppur
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {['services', 'menu', 'howItWorks', 'contact'].map((key) => (
            <Link
              key={key}
              href={`/${locale}/#${key.toLowerCase()}`}
              className="text-sm font-medium text-[var(--color-brown-800)] hover:text-[var(--color-green-800)] transition-colors py-1 relative after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--color-gold-600)] after:scale-x-0 after:transition-transform hover:after:scale-x-100 after:origin-center"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA & Language */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-md font-medium text-white bg-[#25D366] hover:bg-[#20ba5a] transition-all hover:-translate-y-px shadow-sm hover:shadow-[0_4px_16px_rgba(37,211,102,0.35)]"
          >
            {t('whatsapp')}
          </a>
        </div>
        
        {/* Mobile Nav toggle (Hamburger) - right side */}
        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
