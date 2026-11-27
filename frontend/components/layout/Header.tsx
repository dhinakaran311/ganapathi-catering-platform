'use client';

// components/layout/Header.tsx — Public site header.
// Desktop (≥1280px): brand · section links · track · language · WhatsApp.
// Below 1280px (Tamil links don't fit narrower): brand · track · language · menu button → full-screen sheet with large links
// and call / WhatsApp actions. Escape closes; body scroll is locked while open.

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Menu as MenuIcon, X, Phone, PackageSearch } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';
import { useSiteBrand } from '@/components/site/SiteBrand';

export default function Header() {
  const t = useTranslations('Site.nav');
  const locale = useLocale();
  const { logoUrl } = useSiteBrand(); // Settings → Theme logo (null = bundled logo)
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const home = `/${locale}`;
  const links = [
    { href: `${home}#services`, label: t('services') },
    { href: `${home}#menu`, label: t('menu') },
    { href: `${home}#howItWorks`, label: t('process') },
    { href: `${home}#pricing`, label: t('pricing') },
    { href: `${home}/gallery`, label: t('gallery') },
    { href: `${home}#contact`, label: t('contact') },
  ];
  const trackHref = `${home}/track`;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const button = menuButtonRef.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      button?.focus();
    };
  }, [open]);

  return (
    // The sheet lives inside this sticky header (its own stacking context), so
    // while it's open the whole header is lifted above the mobile action bar.
    <header className={`sticky top-0 bg-[var(--site-paper)] ${open ? 'z-[1000]' : 'z-50'}`}>
      <div className="s-container flex h-[var(--site-header)] items-center justify-between gap-2 sm:gap-6">
        <Link href={home} aria-label={t('home')} className="flex flex-none items-center gap-2 sm:gap-3">
          <Image
            src={logoUrl ?? '/logos/logo-192.png'}
            alt=""
            width={44}
            height={44}
            className="h-9 w-9 flex-none object-contain sm:h-11 sm:w-11"
            priority
            unoptimized={Boolean(logoUrl?.startsWith('http'))}
          />
          <span className="flex flex-col leading-tight">
            <span className="s-serif whitespace-nowrap text-[0.86rem] min-[400px]:text-[0.95rem] sm:text-[1.05rem] font-semibold text-[var(--site-leaf-deep)]" lang="ta">
              ஸ்ரீ கணபதி மெஸ்
            </span>
            <span className="text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--site-brass-text)]">
              TIRUPPUR
            </span>
          </span>
        </Link>

        <nav aria-label={t('primary')} className="hidden xl:block">
          <ul className="flex items-center gap-7">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[0.95rem] font-medium text-[var(--site-ink-soft)] transition-colors hover:text-[var(--site-leaf-deep)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-none items-center gap-1 sm:gap-3">
          {/* Track enquiry: full label below 1280px (section links are in the menu) and very wide
              screens; a round icon button at 1280–1535px, where the section links
              already fill the row. The label stays for screen readers. */}
          <Link
            href={trackHref}
            title={t('track')}
            className="s-btn s-btn-outline hidden min-h-[44px] whitespace-nowrap px-4 text-[0.95rem] md:inline-flex xl:w-11 xl:px-0 2xl:w-auto 2xl:px-4"
          >
            <PackageSearch size={18} aria-hidden="true" />
            <span className="xl:sr-only 2xl:not-sr-only">{t('track')}</span>
          </Link>
          <LanguageSwitcher />
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-primary s-wa hidden min-h-[44px] px-5 text-[0.95rem] md:inline-flex"
          >
            <WhatsAppIcon size={18} />
            {t('whatsapp')}
          </a>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={t('openMenu')}
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--site-leaf-deep)] transition-colors hover:bg-[var(--site-paper-deep)] xl:hidden"
          >
            <MenuIcon size={24} />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div
          id="site-menu"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('primary')}
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--site-leaf-deep)] text-[var(--site-on-dark)] xl:hidden"
        >
          <div className="s-container flex h-[var(--site-header)] items-center justify-between">
            <span className="s-serif text-lg font-semibold" lang="ta">ஸ்ரீ கணபதி மெஸ்</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('closeMenu')}
              className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="s-container flex-1 overflow-y-auto pt-6">
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="s-serif block py-2.5 text-[2rem] font-semibold leading-tight transition-colors hover:text-[var(--site-brass-light)]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={trackHref}
                  onClick={() => setOpen(false)}
                  className="s-serif flex items-center gap-3 py-2.5 text-[2rem] font-semibold leading-tight transition-colors hover:text-[var(--site-brass-light)]"
                >
                  <PackageSearch size={28} aria-hidden="true" />
                  {t('track')}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="s-container grid grid-cols-2 gap-3 pb-8 pt-4">
            <a href={SITE.phoneTel} className="s-btn s-btn-on-dark">
              <Phone size={18} />
              {t('call')}
            </a>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-brass">
              <WhatsAppIcon size={18} />
              {t('whatsapp')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
