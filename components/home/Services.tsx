'use client';

import { useTranslations } from 'next-intl';

export default function Services() {
  const t = useTranslations('Occasions');

  const occasions = [
    { key: 'wedding', icon: '💍', color: 'bg-pink-50 text-pink-600' },
    { key: 'family', icon: '👨‍👩‍👧‍👦', color: 'bg-amber-50 text-amber-600' },
    { key: 'corporate', icon: '💼', color: 'bg-blue-50 text-blue-600' },
    { key: 'birthday', icon: '🎂', color: 'bg-purple-50 text-purple-600' },
    { key: 'community', icon: '🏘️', color: 'bg-green-50 text-green-600' },
    { key: 'bulk', icon: '🍱', color: 'bg-orange-50 text-orange-600' }
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] whitespace-pre-line mb-3">
            {t('heading')}
          </h2>
          
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)] italic">
            {t('subheading')}
          </p>
        </div>

        {/* Occasions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {occasions.map(({ key, icon, color }) => (
            <div
              key={key}
              className="group relative bg-[var(--color-ivory-100)] hover:bg-white border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] rounded-xl p-6 md:p-8 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full ${color} text-2xl md:text-3xl mb-4 transition-transform group-hover:scale-110`}>
                {icon}
              </div>
              
              <h3 className="font-display text-lg md:text-xl font-semibold text-[var(--color-brown-900)] leading-snug">
                {t(key)}
              </h3>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
