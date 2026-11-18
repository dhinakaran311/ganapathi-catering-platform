// components/home/ServiceAreaChecker.tsx
// Day 12: "Do you deliver to me?" checker.
//
// Receives the service_areas rows (fetched server-side by the page that renders
// this) and lets a visitor type their area. It fuzzy-matches against the known
// area names (English or Tamil) and shows whether delivery is free or carries
// a charge. Falls back to a call-to-action when there is no match.
// (Matching logic unchanged; copy now translated, Tamil names shown in Tamil.)

'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@/lib/analytics/track';
import { SITE } from '@/lib/site';
import { WhatsAppIcon } from '@/components/site/icons';

export interface ServiceArea {
  id: string;
  name_en: string;
  name_ta: string;
  delivery_available: boolean;
  delivery_charge: number;
  distance_km: number | null;
}

interface ServiceAreaCheckerProps {
  areas: ServiceArea[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9஀-௿]/g, '');
}

export default function ServiceAreaChecker({ areas }: ServiceAreaCheckerProps) {
  const t = useTranslations('Site.areas');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState(false);

  const nameOf = (a: ServiceArea) => (locale === 'ta' && a.name_ta ? a.name_ta : a.name_en);

  const match = useMemo(() => {
    if (!query.trim()) return null;
    const q = normalize(query);
    if (!q) return null;
    return (
      areas.find((a) => {
        const en = normalize(a.name_en);
        const ta = normalize(a.name_ta);
        return en.includes(q) || ta.includes(q) || q.includes(en);
      }) ?? null
    );
  }, [query, areas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChecked(true);
    track({ event: 'service_area_check', metadata: { matched: Boolean(match) } });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="area-query" className="sr-only">{t('inputLabel')}</label>
        <input
          id="area-query"
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setChecked(false); }}
          placeholder={t('placeholder')}
          className="s-field flex-1"
          autoComplete="address-level2"
        />
        <button type="submit" className="s-btn s-btn-primary sm:px-8">
          {t('check')}
        </button>
      </form>

      <div aria-live="polite">
        {checked && (
          <div className="mt-5">
            {match ? (
              match.delivery_available ? (
                <div className="rounded-2xl bg-[var(--site-leaf)] px-6 py-5 text-[var(--site-on-dark)]">
                  <p className="s-serif text-[1.25rem] font-semibold">{t('deliverTo', { area: nameOf(match) })}</p>
                  <p className="mt-1 text-[0.98rem] text-[var(--site-on-dark-soft)]">
                    {Number(match.delivery_charge) === 0
                      ? t('free')
                      : t('charge', { amount: Number(match.delivery_charge).toLocaleString('en-IN') })}
                    {match.distance_km != null && <> {t('away', { km: Number(match.distance_km) })}</>}
                  </p>
                </div>
              ) : (
                <p className="rounded-2xl bg-[var(--site-paper-deep)] px-6 py-5 text-[1rem] text-[var(--site-ink)]">
                  {t('noDelivery', { area: nameOf(match) })}
                </p>
              )
            ) : (
              <div className="rounded-2xl bg-[var(--site-paper-deep)] px-6 py-5">
                <p className="text-[1rem] text-[var(--site-ink)]">{t('notFound')}</p>
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="s-link mt-3 inline-flex items-center gap-2 text-[var(--site-leaf)]"
                >
                  <WhatsAppIcon size={17} />
                  {t('ask')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-[0.9rem] font-semibold text-[var(--site-ink-muted)]">{t('served')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setQuery(nameOf(a)); setChecked(true); }}
              className="min-h-[40px] rounded-full bg-[var(--site-paper-deep)] px-4 text-[0.92rem] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--site-leaf)] hover:text-[var(--site-on-dark)]"
            >
              {nameOf(a)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
