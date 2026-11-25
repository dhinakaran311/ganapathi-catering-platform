'use client';

// components/shared/StickyQuoteButton.tsx — A10: floating "Get a quote".
// Desktop/tablet only (phones have the bottom action bar). Appears after the
// visitor scrolls past the hero; opens WhatsApp with the enquiry template.

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/site/icons';

export default function StickyQuoteButton() {
  const t = useTranslations('Site.nav');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappUrl = buildWhatsAppUrl(generateWhatsAppMessage({ name: '', phone: '' }));

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      id="sticky-quote-btn"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      className={`s-btn s-btn-brass fixed bottom-8 right-8 z-40 hidden md:inline-flex transition-[opacity,transform] duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <WhatsAppIcon size={18} />
      {t('quote')}
    </a>
  );
}
