'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="relative w-full min-h-[calc(100dvh-var(--spacing-nav-mobile))] md:min-h-[calc(100vh-var(--spacing-nav))] flex items-center pt-8 pb-12 overflow-hidden bg-[var(--color-ivory-200)]">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[80%] h-[80%] max-w-[600px] bg-[var(--color-gold-200)] opacity-20 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/4 -translate-y-1/4"></div>
      
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Content Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left gap-6">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)]">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('eyebrow')}
          </span>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-[60px] font-bold text-[var(--color-brown-900)] leading-[1.1] whitespace-pre-line">
            {t('headline')}
          </h1>
          
          <p className="font-body text-base md:text-lg text-[var(--color-brown-700)] max-w-[540px] leading-relaxed">
            {t('description')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mt-2">
            <a href="https://wa.me/919942351280" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[var(--color-green-800)] text-white transition-all hover:bg-[var(--color-green-900)] hover:-translate-y-px shadow-sm hover:shadow-md">
              {t('whatsappBtn')}
            </a>
            <a href="#contact" className="inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-transparent text-[var(--color-green-800)] border-2 border-[var(--color-green-800)] transition-all hover:bg-[var(--color-green-800)] hover:text-white">
              {t('quoteBtn')}
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-6 md:gap-8 mt-6 pt-6 border-t border-[rgba(26,61,32,0.12)]">
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-[var(--color-gold-600)] leading-none">15+</span>
              <span className="font-body text-xs font-medium text-[var(--color-brown-700)] leading-tight whitespace-pre-line">{t('trustYears')}</span>
            </div>
            <div className="w-px h-8 bg-[rgba(26,61,32,0.12)]"></div>
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-[var(--color-gold-600)] leading-none">500</span>
              <span className="font-body text-xs font-medium text-[var(--color-brown-700)] leading-tight whitespace-pre-line">{t('trustGuests')}</span>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="w-full lg:w-1/2 relative flex justify-center">
          <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-t-full rounded-b-[40px] overflow-hidden border-[8px] border-white shadow-[0_8px_32px_rgba(26,61,32,0.12)] bg-[var(--color-ivory-300)]">
            <Image
              src="/images/hero-feast.png"
              alt="Traditional South Indian Banana Leaf Feast"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover hover:scale-105 transition-transform duration-[800ms]"
              priority
            />
          </div>
          {/* Badge Overlay */}
          <div className="absolute -bottom-6 -left-6 md:-left-12 lg:-left-16 bg-white p-4 rounded-xl shadow-lg border border-[var(--color-ivory-300)] flex items-center gap-4 max-w-[220px]">
            <div className="w-12 h-12 rounded-full bg-[var(--color-green-100)] flex items-center justify-center flex-shrink-0 text-xl">
              🌿
            </div>
            <div>
              <div className="font-display font-bold text-[var(--color-brown-900)] leading-tight">Sri Ganapathi</div>
              <div className="font-body text-xs text-[var(--color-brown-500)] whitespace-pre-line">{t('trustStyle')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
