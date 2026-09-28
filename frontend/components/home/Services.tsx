'use client';

import { useTranslations } from 'next-intl';

export default function Services() {
  const t = useTranslations('Occasions');

  const occasions = [
    { key: 'wedding',      icon: '💍', color: 'bg-pink-50 text-pink-600' },
    { key: 'earPiercing',  icon: '👶', color: 'bg-rose-50 text-rose-600' },
    { key: 'engagement',   icon: '💑', color: 'bg-purple-50 text-purple-600' },
    { key: 'houseWarming', icon: '🏡', color: 'bg-yellow-50 text-yellow-600' },
    { key: 'babyShower',   icon: '🍼', color: 'bg-sky-50 text-sky-600' },
    { key: 'birthday',     icon: '🎂', color: 'bg-orange-50 text-orange-600' },
    { key: 'family',       icon: '👨‍👩‍👧‍👦', color: 'bg-amber-50 text-amber-600' },
    { key: 'corporate',    icon: '💼', color: 'bg-blue-50 text-blue-600' },
    { key: 'school',       icon: '🎓', color: 'bg-indigo-50 text-indigo-600' },
    { key: 'temple',       icon: '🛕', color: 'bg-emerald-50 text-emerald-600' },
    { key: 'community',    icon: '🏘️', color: 'bg-green-50 text-green-600' },
    { key: 'bulk',         icon: '🍱', color: 'bg-teal-50 text-teal-600' },
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {occasions.map(({ key, icon, color }) => (
            <div
              key={key}
              className="group relative bg-[var(--color-ivory-100)] hover:bg-white border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] rounded-xl p-5 md:p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-default"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full ${color} text-xl md:text-2xl mb-3 transition-transform group-hover:scale-110`}>
                {icon}
              </div>

              <h3 className="font-display text-sm md:text-base font-semibold text-[var(--color-brown-900)] leading-snug">
                {t(key)}
              </h3>
            </div>
          ))}
        </div>

        {/* Capacity note */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 bg-[var(--color-ivory-100)] border border-[var(--color-ivory-300)] rounded-2xl px-8 py-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-[var(--color-gold-600)]">100</span>
              <span className="font-body text-sm text-[var(--color-brown-700)]">Minimum<br/>Persons</span>
            </div>
            <div className="w-px h-10 bg-[var(--color-ivory-400)] hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-[var(--color-gold-600)]">500</span>
              <span className="font-body text-sm text-[var(--color-brown-700)]">Maximum<br/>Persons</span>
            </div>
            <div className="w-px h-10 bg-[var(--color-ivory-400)] hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-[var(--color-gold-600)]">10+</span>
              <span className="font-body text-sm text-[var(--color-brown-700)]">Years of<br/>Experience</span>
            </div>
            <div className="w-px h-10 bg-[var(--color-ivory-400)] hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <span className="font-body text-3xl">🚚</span>
              <span className="font-body text-sm text-[var(--color-brown-700)]">Free Delivery<br/>within 5 km</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
