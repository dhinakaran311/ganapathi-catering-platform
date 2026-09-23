'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const tNav = useTranslations('Navigation');
  const tFooter = useTranslations('Footer');
  const locale = useLocale();

  return (
    <footer className="bg-[var(--color-green-800)] text-[var(--color-ivory-200)] pt-16 pb-8 border-t-[4px] border-[var(--color-gold-600)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full p-2 flex items-center justify-center">
                <Image
                  src="/logos/logo-512.png"
                  alt="Sri Ganapathi Mess Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex flex-col gap-px">
                <span className="font-tamil text-xl font-bold text-white leading-tight">
                  ஸ்ரீ கணபதி மெஸ்
                </span>
                <span className="font-display text-sm font-semibold text-[var(--color-gold-500)] tracking-widest uppercase leading-tight">
                  Tiruppur
                </span>
              </div>
            </Link>
            <p className="font-body text-sm text-[var(--color-ivory-300)] leading-relaxed max-w-sm">
              {tFooter('tagline')}
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3">
            <h4 className="font-display font-bold text-lg text-[var(--color-gold-500)] mb-4">
              {tFooter('quickLinks')}
            </h4>
            <ul className="flex flex-col gap-3 font-body text-sm text-[var(--color-ivory-200)]">
              <li><Link href={`/${locale}`} className="hover:text-white transition-colors">{tNav('home')}</Link></li>
              <li><Link href={`/${locale}/#about`} className="hover:text-white transition-colors">{tNav('about')}</Link></li>
              <li><Link href={`/${locale}/#howItWorks`} className="hover:text-white transition-colors">{tNav('howItWorks')}</Link></li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="lg:col-span-4">
            <h4 className="font-display font-bold text-lg text-[var(--color-gold-500)] mb-4">
              {tFooter('services')}
            </h4>
            <ul className="flex flex-col gap-3 font-body text-sm text-[var(--color-ivory-200)]">
              <li><Link href={`/${locale}/#services`} className="hover:text-white transition-colors">Weddings &amp; Functions</Link></li>
              <li><Link href={`/${locale}/#services`} className="hover:text-white transition-colors">Corporate Catering</Link></li>
              <li><Link href={`/${locale}/#menu`} className="hover:text-white transition-colors">Banana Leaf Feast</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[rgba(255,253,248,0.1)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-body text-xs text-[var(--color-ivory-400)]">
          <p>© {new Date().getFullYear()} Sri Ganapathi Mess. {tFooter('rights')}</p>
          <p className="font-medium text-[var(--color-gold-500)]">{tFooter('bottomTagline')}</p>
        </div>
      </div>
    </footer>
  );
}
