// components/home/ReviewWidget.tsx
// J71: Public reviews — display approved reviews and let visitors submit one.
// Submitted reviews are stored with is_approved=false and appear only after
// admin approval (app/admin/reviews).

import { createClient } from '@/lib/supabase/server';
import ReviewForm from './ReviewForm';

interface Review {
  id: string;
  customer_name: string;
  event_type: string | null;
  rating: number;
  review_en: string | null;
  review_ta: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--color-gold-500)]" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-[var(--color-ivory-400)]">{'★'.repeat(5 - Math.max(0, Math.min(5, rating)))}</span>
    </span>
  );
}

export default async function ReviewWidget() {
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

  return (
    <section id="reviews" className="py-16 md:py-24 bg-[var(--color-ivory-100)]">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
            Reviews
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] mb-3">
            What families say about us
          </h2>
          {avg && (
            <p className="font-body text-base text-[var(--color-brown-600)]">
              <Stars rating={Math.round(Number(avg))} /> &nbsp;
              <strong>{avg}</strong> average from {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.length === 0 && (
              <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] p-8 text-center">
                <p className="font-body text-sm text-[var(--color-brown-500)]">
                  No reviews yet — be the first to share your experience!
                </p>
              </div>
            )}
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-[var(--color-ivory-300)] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body font-semibold text-[var(--color-brown-900)]">
                    {r.customer_name}
                  </span>
                  <Stars rating={r.rating} />
                </div>
                {(r.event_type || r.review_ta) && (
                  <p className="font-body text-xs text-[var(--color-gold-700)] mb-1">
                    {r.event_type}
                  </p>
                )}
                {(r.review_en || r.review_ta) && (
                  <p className="font-body text-sm text-[var(--color-brown-700)] leading-relaxed">
                    {r.review_en || r.review_ta}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Submission form */}
          <div>
            <ReviewForm />
          </div>
        </div>
      </div>
    </section>
  );
}
