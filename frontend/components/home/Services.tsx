// components/home/Services.tsx — Occasions we cater (#services).
// Editorial layout: arch-cropped wedding photo beside a large typographic list
// of the twelve occasions (replaces the old emoji card grid).

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/site/Reveal';

const OCCASIONS = [
  'wedding', 'engagement', 'earPiercing', 'babyShower', 'houseWarming', 'birthday',
  'family', 'temple', 'corporate', 'school', 'community', 'bulk',
] as const;

export default function Services() {
  const t = useTranslations('Occasions');
  const s = useTranslations('Site.occasions');

  return (
    <section id="services" aria-labelledby="services-title" className="s-section s-deep">
      <div className="s-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-[calc(var(--site-header)+32px)] lg:self-start">
          <div className="s-arch relative mx-auto aspect-[4/5] w-full max-w-[460px] lg:mx-0">
            <Image
              src="/images/catering-wedding.png"
              alt={s('photoAlt')}
              fill
              sizes="(max-width: 1024px) 90vw, 460px"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <h2 id="services-title" className="s-h2 whitespace-pre-line text-[var(--site-leaf-deep)]">
              {t('heading')}
            </h2>
            <p className="s-lead mt-5">{t('subheading')}</p>
          </Reveal>

          <ul className="mt-12 grid gap-x-10 sm:grid-cols-2">
            {OCCASIONS.map((key, i) => (
              <Reveal as="li" key={key} delay={(i % 6) * 50} className="py-3.5">
                <span className="s-serif flex items-baseline gap-3 text-[1.35rem] font-medium leading-snug text-[var(--site-ink)] md:text-[1.5rem]">
                  <span aria-hidden="true" className="inline-block h-2 w-2 flex-none -translate-y-1 rotate-45 bg-[var(--site-brass)]" />
                  {t(key)}
                </span>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <p className="mt-12 rounded-2xl bg-[var(--site-leaf)] px-6 py-5 text-[1rem] font-semibold leading-relaxed text-[var(--site-on-dark)] md:text-[1.05rem]">
              {s('capacity')}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
