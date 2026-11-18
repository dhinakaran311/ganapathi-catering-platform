// components/home/HowItWorks.tsx — The five steps (#howItWorks).
// An ordered path: horizontal on desktop, vertical on phones. Order is carried
// by the <ol> and the path itself (no index numerals or emoji).

import { useTranslations } from 'next-intl';
import Reveal from '@/components/site/Reveal';

const STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');
  const s = useTranslations('Site.process');

  return (
    <section id="howItWorks" aria-labelledby="process-title" className="s-section s-deep">
      <div className="s-container">
        <Reveal className="max-w-[760px]">
          <h2 id="process-title" className="s-h2 whitespace-pre-line text-[var(--site-leaf-deep)]">
            {t('heading')}
          </h2>
          <p className="s-lead mt-5">{s('lead')}</p>
        </Reveal>

        <ol className="relative mt-16 grid gap-10 md:mt-20 lg:grid-cols-5 lg:gap-8">
          {/* the path */}
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[7px] top-3 w-[4px] rounded-full bg-[var(--site-brass)]/35 lg:bottom-auto lg:left-0 lg:right-0 lg:top-[7px] lg:h-[4px] lg:w-auto"
          />
          {STEPS.map((key, i) => (
            <Reveal as="li" key={key} delay={i * 80} className="relative pl-10 lg:pl-0 lg:pt-12">
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1 h-[18px] w-[18px] rounded-full lg:top-0 ${
                  i === STEPS.length - 1 ? 'bg-[var(--site-leaf)]' : 'bg-[var(--site-brass)]'
                }`}
              />
              <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t(`steps.${key}.title`)}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--site-ink-soft)]">
                {t(`steps.${key}.desc`)}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
