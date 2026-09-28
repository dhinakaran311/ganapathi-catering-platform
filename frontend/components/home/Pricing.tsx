'use client';

// components/home/Pricing.tsx — Day 10: Pricing + Service Area Checker

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const PACKAGES = [
  {
    id: 'basic',
    price: 90,
    accent: false,
    popular: false,
  },
  {
    id: 'full',
    price: 130,
    accent: true,
    popular: true,
  },
  {
    id: 'custom',
    price: null,
    accent: false,
    popular: false,
  },
];

const SERVICE_AREAS = [
  { id: 'velliyangadu',       distanceKm: 0,  charge: 0 },
  { id: '60feet',             distanceKm: 3,  charge: 0 },
  { id: 'pushpa',             distanceKm: 4,  charge: 0 },
  { id: 'avinashiPalayam',    distanceKm: 4,  charge: 0 },
  { id: 'nallur',             distanceKm: 5,  charge: 0 },
  { id: 'veerapandi',         distanceKm: 5,  charge: 0 },
  { id: 'avinashi',           distanceKm: 18, charge: 1800 },
  { id: 'palladam',           distanceKm: 20, charge: 2000 },
  { id: 'perumanallur',       distanceKm: 15, charge: 1500 },
  { id: 'kangeyam',           distanceKm: 25, charge: 2500 },
];

export default function Pricing() {
  const t = useTranslations('Pricing');
  const [guestCount, setGuestCount] = useState(200);
  const [selectedPkg, setSelectedPkg] = useState<'basic' | 'full'>('full');

  const estimatedTotal = guestCount * (selectedPkg === 'basic' ? 90 : 130);
  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <section id="pricing" className="py-16 md:py-24 bg-[var(--color-ivory-200)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">

        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] mb-3">
            {t('heading')}
          </h2>
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)] italic">
            {t('subheading')}
          </p>
        </div>

        {/* Packages */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {PACKAGES.map((pkg) => {
            const includes: string[] = t.raw(`${pkg.id}.includes`);
            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 border transition-all ${
                  pkg.accent
                    ? 'bg-[var(--color-green-900)] border-[var(--color-green-800)] text-white shadow-xl'
                    : 'bg-white border-[var(--color-ivory-300)] hover:shadow-md'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-gold-600)] text-white font-body text-xs font-bold px-4 py-1 rounded-full shadow whitespace-nowrap">
                    {t('popular')}
                  </span>
                )}
                <p className={`font-body text-xs font-semibold uppercase tracking-wide mb-1 ${pkg.accent ? 'text-white/60' : 'text-[var(--color-brown-500)]'}`}>
                  {t(`${pkg.id}.name`)}
                </p>
                <h3 className={`font-display text-xl font-bold mb-3 ${pkg.accent ? 'text-white' : 'text-[var(--color-brown-900)]'}`}>
                  {t(`${pkg.id}.name`)}
                </h3>

                <div className="mb-4">
                  {pkg.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`font-display text-4xl font-bold ${pkg.accent ? 'text-[var(--color-gold-300)]' : 'text-[var(--color-gold-600)]'}`}>
                        {formatINR(pkg.price).replace('₹', '₹')}
                      </span>
                      <span className={`font-body text-sm ${pkg.accent ? 'text-white/60' : 'text-[var(--color-brown-500)]'}`}>
                        /{t('perPerson')}
                      </span>
                    </div>
                  ) : (
                    <div className={`font-display text-2xl font-bold ${pkg.accent ? 'text-[var(--color-gold-300)]' : 'text-[var(--color-gold-600)]'}`}>
                      {t('contactUs')}
                    </div>
                  )}
                </div>

                <p className={`font-body text-sm mb-5 ${pkg.accent ? 'text-white/80' : 'text-[var(--color-brown-600)]'}`}>
                  {t(`${pkg.id}.desc`)}
                </p>

                <ul className="space-y-2 mb-6">
                  {includes.map((item) => (
                    <li key={item} className={`font-body text-sm flex items-start gap-2 ${pkg.accent ? 'text-white/90' : 'text-[var(--color-brown-700)]'}`}>
                      <span className={`mt-0.5 flex-shrink-0 ${pkg.accent ? 'text-[var(--color-gold-300)]' : 'text-[var(--color-green-700)]'}`}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`w-full inline-flex items-center justify-center h-11 rounded-lg font-body text-sm font-semibold transition-all ${
                    pkg.accent
                      ? 'bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-700)] text-white shadow-md'
                      : 'bg-[var(--color-ivory-200)] hover:bg-[var(--color-ivory-300)] text-[var(--color-brown-800)] border border-[var(--color-ivory-400)]'
                  }`}
                >
                  {t('getQuote')}
                </a>
              </div>
            );
          })}
        </div>

        {/* Estimate Calculator */}
        <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] shadow-sm p-6 md:p-8 mb-10">
          <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-2">
            {t('estimateHeading')}
          </h3>
          <p className="font-body text-sm text-[var(--color-brown-500)] mb-6">
            {t('estimateSubheading')}
          </p>

          {/* Package selector */}
          <div className="flex gap-3 mb-6">
            {(['basic', 'full'] as const).map((p) => (
              <button
                key={p}
                id={`calc-pkg-${p}`}
                onClick={() => setSelectedPkg(p)}
                className={`flex-1 py-2.5 rounded-lg font-body text-sm font-semibold border transition-all ${
                  selectedPkg === p
                    ? 'bg-[var(--color-green-800)] text-white border-[var(--color-green-800)]'
                    : 'bg-white text-[var(--color-brown-700)] border-[var(--color-ivory-300)] hover:border-[var(--color-brown-300)]'
                }`}
              >
                {t(`${p}.name`)} ({formatINR(p === 'basic' ? 90 : 130)}/{t('perPerson')})
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="guest-slider" className="font-body text-sm font-semibold text-[var(--color-brown-700)]">
                {t('guestCount')}
              </label>
              <span className="font-display text-2xl font-bold text-[var(--color-brown-900)]">{guestCount}</span>
            </div>
            <input
              id="guest-slider"
              type="range"
              min={100}
              max={500}
              step={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full h-2 bg-[var(--color-ivory-300)] rounded-full appearance-none cursor-pointer accent-[var(--color-green-800)]"
            />
            <div className="flex justify-between font-body text-xs text-[var(--color-brown-400)] mt-1">
              <span>100</span><span>500</span>
            </div>
          </div>

          {/* Result */}
          <div className="flex items-center justify-between bg-[var(--color-ivory-100)] rounded-xl p-4 border border-[var(--color-ivory-300)]">
            <div>
              <p className="font-body text-sm text-[var(--color-brown-500)]">
                {t('estimatedTotal', { count: guestCount })}
              </p>
              <p className="font-body text-xs text-[var(--color-brown-400)]">{t('deliveryIfApplicable')}</p>
            </div>
            <div className="font-display text-3xl font-bold text-[var(--color-green-800)]">
              {formatINR(estimatedTotal)}
            </div>
          </div>

          <p className="font-body text-xs text-[var(--color-brown-400)] mt-3 text-center">
            {t('disclaimer')}
          </p>
        </div>

        {/* Service Area Checker */}
        <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] shadow-sm p-6 md:p-8">
          <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-2">
            {t('deliveryHeading')}
          </h3>
          <p className="font-body text-sm text-[var(--color-brown-500)] mb-6">
            {t('deliverySubheading')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICE_AREAS.map((area) => (
              <div
                key={area.id}
                className={`rounded-xl p-4 border text-center ${
                  area.charge === 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-[var(--color-ivory-100)] border-[var(--color-ivory-300)]'
                }`}
              >
                <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] mb-1">
                  {t(`areas.${area.id}`)}
                </p>
                <p className="font-body text-xs text-[var(--color-brown-500)] mb-2">
                  {t('kmAway', { dist: area.distanceKm })}
                </p>
                {area.charge === 0 ? (
                  <span className="inline-block font-body text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {t('free')}
                  </span>
                ) : (
                  <span className="inline-block font-body text-xs font-semibold text-[var(--color-brown-700)]">
                    ~{formatINR(area.charge)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-[var(--color-brown-400)] mt-4 text-center">
            {t('deliveryNote')}
          </p>
        </div>

      </div>
    </section>
  );
}
