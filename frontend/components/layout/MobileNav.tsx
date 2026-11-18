'use client';

// components/layout/MobileNav.tsx — Mobile bottom action bar.
// One thumb-reachable bar with the three things a phone visitor wants: call,
// WhatsApp, or jump to the enquiry form. (Section navigation lives in the
// header's menu sheet.) Replaces the old bottom tabs + floating WhatsApp
// button, which overlapped the sticky quote button.

import { useLocale, useTranslations } from 'next-intl';
import { Phone, ClipboardList } from 'lucide-react';
import { WhatsAppIcon } from '@/components/site/icons';
import { track } from '@/lib/analytics/track';
import { SITE } from '@/lib/site';

export default function MobileNav() {
  const t = useTranslations('Site.nav');
  const locale = useLocale();

  const item =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[0.78rem] font-semibold leading-tight transition-colors active:bg-black/5';

  return (
    <nav
      aria-label={t('contact')}
      className="fixed inset-x-0 bottom-0 z-[800] flex h-[var(--spacing-nav-mobile)] bg-[var(--site-paper)] pb-[env(safe-area-inset-bottom)] text-[var(--site-leaf-deep)] md:hidden"
      style={{ boxShadow: '0 -1px 0 rgba(13,38,17,0.08)' }}
    >
      <a href={SITE.phoneTel} className={item}>
        <Phone size={20} aria-hidden="true" />
        {t('call')}
      </a>
      <a
        href={SITE.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track({ event: 'whatsapp_open', metadata: { source: 'mobile_bar' } })}
        className={`${item} s-wa`}
      >
        <WhatsAppIcon size={21} />
        {t('whatsapp')}
      </a>
      <a href={`/${locale}#contact`} className={item}>
        <ClipboardList size={20} aria-hidden="true" />
        {t('quote')}
      </a>
    </nav>
  );
}
