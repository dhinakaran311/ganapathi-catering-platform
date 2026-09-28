'use client';

import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');

  const steps = [
    { key: 'step1', icon: '📋', number: '01' },
    { key: 'step2', icon: '💬', number: '02' },
    { key: 'step3', icon: '🍽️', number: '03' },
    { key: 'step4', icon: '💰', number: '04' },
    { key: 'step5', icon: '🎉', number: '05' },
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
        <div className="grid md:grid-cols-5 gap-6 md:gap-4 relative">

          {/* Connector Line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold-300)] to-transparent -z-10" />

          {steps.map(({ key, icon, number }, index) => (
            <div
              key={key}
              className="relative bg-white rounded-2xl p-6 text-center border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] hover:shadow-xl transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--color-gold-600)] text-white font-display font-bold text-sm flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                {number}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 mt-4">{icon}</div>

              {/* Content */}
              <h3 className="font-display text-base md:text-lg font-bold text-[var(--color-brown-900)] mb-3">
                {t(`steps.${key}.title`)}
              </h3>

              <p className="font-body text-xs md:text-sm text-[var(--color-brown-600)] leading-relaxed">
                {t(`steps.${key}.desc`)}
              </p>

              {/* Arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center mt-4 text-2xl text-[var(--color-gold-600)]">↓</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[#25D366] text-white transition-all hover:bg-[#1da851] hover:-translate-y-px shadow-md hover:shadow-lg"
          >
            💬 Start Your Enquiry
          </a>
        </div>

      </div>
    </section>
  );
}
