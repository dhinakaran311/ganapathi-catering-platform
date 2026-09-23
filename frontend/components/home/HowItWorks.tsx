'use client';

import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');

  const steps = [
    { key: 'step1', icon: '📱', number: '01' },
    { key: 'step2', icon: '💰', number: '02' },
    { key: 'step3', icon: '🎉', number: '03' }
  ];

  return (
    <section id="howItWorks" className="py-16 md:py-24 bg-[var(--color-ivory-200)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] whitespace-pre-line">
            {t('heading')}
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
          
          {/* Connector Lines (desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold-300)] to-transparent -z-10" />

          {steps.map(({ key, icon, number }, index) => (
            <div
              key={key}
              className="relative bg-white rounded-2xl p-8 text-center border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] hover:shadow-xl transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[var(--color-gold-600)] text-white font-display font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                {number}
              </div>

              {/* Icon */}
              <div className="text-5xl md:text-6xl mb-6 mt-4">{icon}</div>

              {/* Content */}
              <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-4">
                {t(`steps.${key}.title`)}
              </h3>
              
              <p className="font-body text-sm md:text-base text-[var(--color-brown-600)] leading-relaxed">
                {t(`steps.${key}.desc`)}
              </p>

              {/* Arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center mt-6 text-3xl text-[var(--color-gold-600)]">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
