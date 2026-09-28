'use client';

import { useEffect, useState } from 'react';
import { buildWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp';

export default function StickyQuoteButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const whatsappUrl = buildWhatsAppUrl(
    generateWhatsAppMessage({ name: '', phone: '' })
  );

  if (!isVisible) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      id="sticky-quote-btn"
      aria-label="Get a Quote via WhatsApp"
      className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-6 flex items-center gap-2 px-5 py-3 rounded-full font-body font-semibold text-sm bg-[var(--color-gold-600)] text-white shadow-lg hover:bg-[var(--color-gold-700)] hover:-translate-y-1 transition-all duration-300"
      style={{
        animation: 'fadeInUp 0.4s ease',
        boxShadow: '0 4px 20px rgba(184,134,11,0.4)',
      }}
    >
      <span>📋</span>
      <span>Get Quote</span>
    </a>
  );
}
