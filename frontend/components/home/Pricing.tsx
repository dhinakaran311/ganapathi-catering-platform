'use client';

// components/home/Pricing.tsx — Packages, live estimate, delivery charges (#pricing).
// Same packages, prices, estimator maths and delivery table as before.
// Layout: the popular Full Meals package as a large dark block, the other two
// beside it; then the estimator as a single wide band; then the area table.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/site/Reveal';

const PACKAGES = [
  { id: 'full', price: 130 },
  { id: 'basic', price: 90 },
  { id: 'custom', price: null },
] as const;

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

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Pricing() {
  const t = useTranslations('Pricing');
  const s = useTranslations('Site.pricing');
  const [guestCount, setGuestCount] = useState(200);
  const [selectedPkg, setSelectedPkg] = useState<'basic' | 'full'>('full');

  const estimatedTotal = guestCount * (selectedPkg === 'basic' ? 90 : 130);

  const renderPackage = (id: string, price: number | null, dark: boolean) => {
    const includes: string[] = t.raw(`${id}.includes`);
    return (
      <>
        <h3 className={`s-h3 ${dark ? 'text-[var(--site-on-dark)]' : 'text-[var(--site-leaf-deep)]'}`}>{t(`${id}.name`)}</h3>
        <p className={`mt-2 text-[0.98rem] ${dark ? 'text-[var(--site-on-dark-soft)]' : 'text-[var(--site-ink-soft)]'}`}>
          {t(`${id}.desc`)}
        </p>
        <p className="mt-6 flex items-baseline gap-2">
          {price !== null ? (
            <>
              <span className={`s-figure !text-[clamp(2.6rem,5vw,3.8rem)] ${dark ? 'text-[var(--site-brass-light)]' : 'text-[var(--site-leaf-deep)]'}`}>
                ₹{price}
              </span>
              <span className={dark ? 'text-[var(--site-on-dark-soft)]' : 'text-[var(--site-ink-muted)]'}>/ {t('perPerson')}</span>
            </>
          ) : (
            <span className={`text-[1.05rem] font-semibold ${dark ? 'text-[var(--site-brass-light)]' : 'text-[var(--site-brass-text)]'}`}>
              {t('contactUs')}
            </span>
          )}
        </p>
        <ul className="mt-6 space-y-2">
          {includes.map((item) => (
            <li key={item} className={`flex gap-3 text-[0.98rem] ${dark ? 'text-[var(--site-on-dark)]' : 'text-[var(--site-ink)]'}`}>
              <span aria-hidden="true" className={`mt-[0.55em] h-1.5 w-1.5 flex-none rotate-45 ${dark ? 'bg-[var(--site-brass-light)]' : 'bg-[var(--site-brass)]'}`} />
              {item}
            </li>
          ))}
        </ul>
        <a href="#contact" className={`s-btn mt-8 ${dark ? 's-btn-brass' : 's-btn-outline'}`}>
          {t('getQuote')}
        </a>
      </>
    );
  };

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="s-section">
      <div className="s-container">
        <Reveal className="max-w-[760px]">
          <h2 id="pricing-title" className="s-h2 text-[var(--site-leaf-deep)]">{t('heading')}</h2>
          <p className="s-lead mt-5">{t('subheading')}</p>
        </Reveal>

        {/* Packages: the popular Full Meals package as a wide feature band,
            the other two side by side beneath it. */}
        <Reveal className="mt-14 rounded-[28px] bg-[var(--site-leaf-deep)] p-8 md:p-11">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="mb-5 text-[0.9rem] font-semibold text-[var(--site-brass-light)]">{t('popular')}</p>
              <h3 className="s-h3 text-[var(--site-on-dark)]">{t('full.name')}</h3>
              <p className="mt-2 text-[0.98rem] text-[var(--site-on-dark-soft)]">{t('full.desc')}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="s-figure text-[var(--site-brass-light)]">₹130</span>
                <span className="text-[var(--site-on-dark-soft)]">/ {t('perPerson')}</span>
              </p>
              <a href="#contact" className="s-btn s-btn-brass mt-8">{t('getQuote')}</a>
            </div>
            <ul className="grid content-start gap-x-8 gap-y-3 sm:grid-cols-2 lg:pt-12">
              {(t.raw('full.includes') as string[]).map((item) => (
                <li key={item} className="flex gap-3 text-[1rem] text-[var(--site-on-dark)]">
                  <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 flex-none rotate-45 bg-[var(--site-brass-light)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {PACKAGES.filter((p) => p.id !== 'full').map((p, i) => (
            <Reveal key={p.id} delay={(i + 1) * 90} className="rounded-[28px] bg-[var(--site-paper-deep)] p-8 md:p-10">
              {renderPackage(p.id, p.price, false)}
            </Reveal>
          ))}
        </div>

        {/* Live estimate */}
        <Reveal className="mt-5 rounded-[28px] bg-[var(--site-paper-deep)] p-8 md:p-11">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t('estimateHeading')}</h3>
              <p className="mt-2 text-[0.98rem] text-[var(--site-ink-soft)]">{t('estimateSubheading')}</p>

              <div role="group" aria-label={s('packageLabel')} className="mt-6 flex flex-wrap gap-2">
                {(['full', 'basic'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selectedPkg === p}
                    onClick={() => setSelectedPkg(p)}
                    className={`s-btn min-h-[46px] px-5 text-[0.95rem] ${selectedPkg === p ? 's-btn-primary' : 's-btn-outline'}`}
                  >
                    {t(`${p}.name`)} · {formatINR(p === 'basic' ? 90 : 130)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="guest-range" className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-[var(--site-ink)]">{t('guestCount')}</span>
                <span className="s-serif text-[2rem] font-semibold tabular-nums text-[var(--site-leaf-deep)]">{guestCount}</span>
              </label>
              <input
                id="guest-range"
                type="range"
                min={100}
                max={500}
                step={10}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="mt-3 h-3 w-full cursor-pointer accent-[var(--site-leaf)]"
              />
              <div className="mt-1 flex justify-between text-[0.8rem] text-[var(--site-ink-muted)]">
                <span>100</span><span>500</span>
              </div>

              <p className="mt-7 text-[0.95rem] text-[var(--site-ink-soft)]" aria-live="polite">
                {t('estimatedTotal', { count: guestCount })}
              </p>
              <p className="s-figure mt-1 tabular-nums text-[var(--site-leaf-deep)]">{formatINR(estimatedTotal)}</p>
              <p className="mt-2 text-[0.88rem] text-[var(--site-ink-muted)]">{t('deliveryIfApplicable')}</p>
            </div>
          </div>
          <p className="mt-8 text-[0.85rem] italic text-[var(--site-ink-muted)]">{t('disclaimer')}</p>
        </Reveal>

        {/* Delivery charges */}
        <Reveal className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t('deliveryHeading')}</h3>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--site-ink-soft)]">{t('deliverySubheading')}</p>
            <p className="mt-3 text-[0.9rem] text-[var(--site-ink-muted)]">{t('deliveryNote')}</p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {SERVICE_AREAS.map((area, i) => (
              <li
                key={area.id}
                className={`flex items-baseline justify-between gap-4 rounded-xl px-4 py-3 ${i % 4 < 2 ? 'sm:bg-[var(--site-paper-deep)]' : ''} ${i % 2 === 0 ? 'max-sm:bg-[var(--site-paper-deep)]' : ''}`}
              >
                <span>
                  <span className="block font-semibold text-[var(--site-ink)]">{t(`areas.${area.id}`)}</span>
                  <span className="block text-[0.82rem] text-[var(--site-ink-muted)]">{t('kmAway', { dist: area.distanceKm })}</span>
                </span>
                <span className={`font-semibold tabular-nums ${area.charge === 0 ? 'text-[var(--site-leaf-bright)]' : 'text-[var(--site-ink)]'}`}>
                  {area.charge === 0 ? t('free') : formatINR(area.charge)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
