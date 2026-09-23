'use client';

import { useTranslations } from 'next-intl';

export default function Story() {
  const t = useTranslations('Story');

  const pillars = [
    { key: 'fresh', icon: '🌱' },
    { key: 'taste', icon: '🍛' },
    { key: 'time', icon: '⏰' },
    { key: 'custom', icon: '📋' }
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-[var(--color-ivory-200)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] whitespace-pre-line mb-6">
            {t('heading')}
          </h2>
          
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)] italic mb-8">
            {t('tagline')}
          </p>

          {/* Story Content */}
          <div className="text-left space-y-4 mb-8">
            <p className="font-body text-base md:text-lg text-[var(--color-brown-700)] leading-relaxed">
              {t('p1')}
            </p>
            <p className="font-body text-base md:text-lg text-[var(--color-brown-700)] leading-relaxed">
              {t('p2')}
            </p>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-[var(--color-ivory-300)]">
            <div className="w-12 h-12 rounded-full bg-[var(--color-green-100)] flex items-center justify-center flex-shrink-0 text-2xl">
              🌿
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[var(--color-brown-900)] text-base leading-tight">
                {t('badgeTitle')}
              </div>
              <div className="font-body text-xs text-[var(--color-brown-500)]">
                {t('badgeSub')}
              </div>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {pillars.map(({ key, icon }) => (
            <div
              key={key}
              className="bg-white rounded-xl p-6 text-center border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] hover:shadow-md transition-all"
            >
              <div className="text-3xl md:text-4xl mb-3">{icon}</div>
              <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-brown-900)] mb-2">
                {t(`pillars.${key}.title`)}
              </h3>
              <p className="font-body text-sm text-[var(--color-brown-600)]">
                {t(`pillars.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
