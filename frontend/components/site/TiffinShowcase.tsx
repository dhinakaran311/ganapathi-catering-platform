// components/site/TiffinShowcase.tsx — Hero "live element": an interactive 3D
// steel tiffin carrier that opens to reveal the real menu tiers.
//
// • three.js is code-split and imported only after hydration, so it never
//   delays the first paint / LCP (the hero headline).
// • Falls back to the banana-leaf photo when WebGL is unavailable, on very
//   low-powered devices, or when the user has Data Saver on.
// • The Open/Close button + tier list are plain HTML, so the content is fully
//   available to keyboard and screen-reader users without the canvas.

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { TiffinController } from './tiffin/scene';

type Mode = 'loading' | 'ready' | 'fallback';

function shouldUseFallback(): boolean {
  try {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData) return true;
    if ((nav.hardwareConcurrency ?? 8) <= 2) return true;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return true;
    const c = document.createElement('canvas');
    return !(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return true;
  }
}

export default function TiffinShowcase() {
  const t = useTranslations('Site.tiffin');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrlRef = useRef<TiffinController | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (shouldUseFallback()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('fallback');
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    import('./tiffin/scene')
      .then(({ createTiffinScene }) => {
        if (cancelled || !canvasRef.current) return;
        ctrlRef.current = createTiffinScene(canvasRef.current, {
          reducedMotion,
          onReady: () => !cancelled && setMode('ready'),
        });
      })
      .catch(() => !cancelled && setMode('fallback'));

    return () => {
      cancelled = true;
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    ctrlRef.current?.setOpen(open);
  }, [open]);

  const tiers = [
    { name: t('tierTop'), items: t('tierTopItems') },
    { name: t('tierMiddle'), items: t('tierMiddleItems') },
    { name: t('tierBottom'), items: t('tierBottomItems') },
  ];

  return (
    <figure className="relative w-full">
      {/* Arch "shrine" the tiffin stands in */}
      <div className="s-arch relative aspect-[4/5] w-full max-w-[540px] mx-auto bg-[var(--site-paper-deep)]">
        {mode === 'fallback' ? (
          <Image
            src="/images/hero-feast.png"
            alt={t('fallbackAlt')}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 540px"
            className="object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('canvasLabel')}
            className={`absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing touch-pan-y transition-opacity duration-700 ${
              mode === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Controls + what's inside (always real HTML) */}
      <figcaption className="mt-6 max-w-[540px] mx-auto">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {mode !== 'fallback' && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-pressed={open}
              aria-controls="tiffin-tiers"
              className="s-btn s-btn-outline min-h-[46px] px-5 text-[0.95rem]"
            >
              {open ? t('close') : t('open')}
            </button>
          )}
          {mode === 'ready' && (
            <span className="text-sm text-[var(--site-ink-muted)] hidden sm:inline" aria-hidden="true">
              {t('hint')}
            </span>
          )}
        </div>

        <div id="tiffin-tiers" aria-live="polite">
          {open || mode === 'fallback' ? (
            <ol className="mt-5 grid gap-3">
              {tiers.map((tier) => (
                <li key={tier.name} className="grid grid-cols-[minmax(7.5rem,auto)_1fr] gap-x-4 items-baseline">
                  <span className="s-serif font-semibold text-[var(--site-leaf)]">{tier.name}</span>
                  <span className="text-[0.95rem] text-[var(--site-ink-soft)]">{tier.items}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--site-ink-soft)] max-w-[44ch]">
              {t('caption')}
            </p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
