// components/home/Story.tsx — Our story (#about).
// Full-bleed dark green block: kitchen photo, the story in two paragraphs, the
// client's own figures set large, and the four promises as a plain list.

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/site/Reveal';

const PILLARS = ['fresh', 'taste', 'time', 'custom'] as const;

export default function Story() {
  const t = useTranslations('Story');
  const s = useTranslations('Site.story');

  const figures = [
    { value: '10+', label: s('yearsLabel') },
    { value: '300', label: s('largestLabel') },
    { value: '₹90', label: s('fromLabel') },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="s-section s-dark">
      <div className="s-container">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:items-end">
          <Reveal>
            <h2 id="about-title" className="s-h2 whitespace-pre-line">
              {t('heading')}
            </h2>
            <p className="s-serif mt-6 text-xl italic text-[var(--site-brass-light)] md:text-2xl">
              {s('knownFor')}
            </p>
            <div className="mt-8 space-y-5">
              <p className="s-lead">{t('p1')}</p>
              <p className="s-lead">{t('p2')}</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="s-arch relative mx-auto aspect-[4/5] w-full max-w-[420px] lg:mx-0 lg:ml-auto">
              <Image
                src="/images/hotel/kitchen.jpg"
                alt={s('photoAlt')}
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <dl className="mt-20 grid gap-10 sm:grid-cols-3 md:mt-24">
          {figures.map((f, i) => (
            <Reveal key={f.value} delay={i * 90}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="s-figure block text-[var(--site-brass-light)]">{f.value}</span>
                <span className="mt-3 block max-w-[24ch] text-[1rem] leading-snug text-[var(--site-on-dark-soft)]">
                  {f.label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>

        <ul className="mt-20 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((key, i) => (
            <Reveal as="li" key={key} delay={i * 70}>
              <h3 className="s-h3 text-[var(--site-on-dark)]">{t(`pillars.${key}.title`)}</h3>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-[var(--site-on-dark-soft)]">
                {t(`pillars.${key}.desc`)}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
