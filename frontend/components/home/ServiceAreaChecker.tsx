// components/home/ServiceAreaChecker.tsx
// Day 12: "Do you deliver to me?" checker.
//
// Receives the service_areas rows (fetched server-side by the page that renders
// this) and lets a visitor type their area. It fuzzy-matches against the known
// area names (English or Tamil) and shows whether delivery is free or carries
// a charge. Falls back to a call-to-action when there is no match.

'use client';

import { useMemo, useState } from 'react';

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
  return s.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
}

export default function ServiceAreaChecker({ areas }: ServiceAreaCheckerProps) {
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState(false);

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
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent';

  return (
    <div className="bg-[var(--color-ivory-100)] rounded-2xl p-6 md:p-8 border border-[var(--color-ivory-300)]">
      <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-3">
        Do we deliver to you?
      </h3>
      <p className="font-body text-sm text-[var(--color-brown-600)] mb-4">
        Enter your area to check delivery availability and charges.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setChecked(false); }}
          placeholder="e.g. Avinashi, Palladam, Velliyangadu…"
          className={inputClass}
          aria-label="Your area"
        />
        <button
          type="submit"
          className="px-6 h-[46px] rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors whitespace-nowrap"
        >
          Check
        </button>
      </form>

      {checked && (
        <div className="mt-4">
          {match ? (
            match.delivery_available ? (
              <div className="rounded-xl bg-[var(--color-green-100)] border border-[var(--color-green-200)] p-4">
                <p className="font-body text-sm font-semibold text-[var(--color-green-900)] mb-1">
                  ✅ We deliver to {match.name_en}
                </p>
                <p className="font-body text-sm text-[var(--color-brown-700)]">
                  {Number(match.delivery_charge) === 0
                    ? 'Delivery is FREE for this area.'
                    : `Delivery charge: ₹${Number(match.delivery_charge)}`}
                  {match.distance_km != null && ` · ~${Number(match.distance_km)} km away`}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--color-ivory-200)] border border-[var(--color-ivory-400)] p-4">
                <p className="font-body text-sm text-[var(--color-brown-700)]">
                  We don&apos;t currently deliver to {match.name_en}. Please call us — we may be
                  able to make an arrangement.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-xl bg-[var(--color-ivory-200)] border border-[var(--color-ivory-400)] p-4">
              <p className="font-body text-sm text-[var(--color-brown-700)] mb-2">
                We couldn&apos;t find that area automatically. We deliver up to 30 km from
                Velliyangadu, Tiruppur.
              </p>
              <a
                href="https://wa.me/919942351280"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#25D366] hover:underline"
              >
                Ask us on WhatsApp →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Known areas list */}
      <div className="mt-5">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-2">
          Areas we serve
        </p>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setQuery(a.name_en); setChecked(true); }}
              className="px-3 py-1.5 rounded-full bg-white border border-[var(--color-ivory-300)] font-body text-xs text-[var(--color-brown-700)] hover:border-[var(--color-green-800)] hover:text-[var(--color-green-800)] transition-colors"
            >
              {a.name_en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
