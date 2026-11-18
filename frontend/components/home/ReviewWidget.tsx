// components/home/ReviewWidget.tsx
// J71: Public reviews — display approved reviews and let visitors submit one.
// Submitted reviews are stored with is_approved=false and appear only after
// admin approval (app/admin/reviews). Data fetching is unchanged.

import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ReviewForm from './ReviewForm';
import Reveal from '@/components/site/Reveal';

interface Review {
  id: string;
  customer_name: string;
  event_type: string | null;
  rating: number;
  review_en: string | null;
  review_ta: string | null;
}

function Stars({ rating, label }: { rating: number; label: string }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span role="img" aria-label={label} className="text-[1.05rem] tracking-[0.12em]">
      <span className="text-[var(--site-brass)]">{'★'.repeat(r)}</span>
      <span className="text-[#D9CCB2]">{'★'.repeat(5 - r)}</span>
    </span>
  );
}

export default async function ReviewWidget() {
  const t = await getTranslations('Site.reviews');
  const locale = await getLocale();
  const supabase = await createClient();

  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, event_type, rating, review_en, review_ta')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(12);

  const reviews = (data ?? []) as Review[];
  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  const textFor = (r: Review) =>
    (locale === 'ta' ? r.review_ta || r.review_en : r.review_en || r.review_ta) ?? '';

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="s-section s-deep">
      <div className="s-container grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <Reveal>
            <h2 id="reviews-title" className="s-h2 text-[var(--site-leaf-deep)]">{t('title')}</h2>
            {avg && (
              <p className="mt-5 flex flex-wrap items-center gap-3 text-[1rem] text-[var(--site-ink-soft)]">
                <Stars rating={Number(avg)} label={t('stars', { n: avg })} />
                {t('average', { avg, count: reviews.length })}
              </p>
            )}
          </Reveal>

          {reviews.length === 0 ? (
            <p className="mt-10 text-[1.05rem] text-[var(--site-ink-soft)]">{t('empty')}</p>
          ) : (
            <ul className="mt-12 space-y-12">
              {reviews.map((r, i) => (
                <Reveal as="li" key={r.id} delay={Math.min(i, 3) * 70}>
                  <figure>
                    <blockquote className="s-serif text-[1.35rem] leading-[1.45] text-[var(--site-ink)] md:text-[1.55rem]">
                      “{textFor(r)}”
                    </blockquote>
                    <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.95rem]">
                      <span className="font-semibold text-[var(--site-leaf-deep)]">{r.customer_name}</span>
                      {r.event_type && <span className="text-[var(--site-ink-muted)]">{r.event_type}</span>}
                      <Stars rating={r.rating} label={t('stars', { n: r.rating })} />
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </ul>
          )}
        </div>

        <Reveal delay={100} className="lg:sticky lg:top-[calc(var(--site-header)+32px)] lg:self-start">
          <ReviewForm />
        </Reveal>
      </div>
    </section>
  );
}
