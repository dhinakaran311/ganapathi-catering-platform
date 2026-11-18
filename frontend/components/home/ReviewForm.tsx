// components/home/ReviewForm.tsx
// J71: Client form for submitting a public review. Posts to /api/reviews and
// shows an inline success message. The review appears after admin approval.
// (Request payload, validation, honeypot and Turnstile handling unchanged.)

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

// Values are stored in the DB as-is; only the labels are translated.
const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate', 'Family Function', 'Engagement',
  'House Warming', 'Baby Shower', 'Other',
];

export default function ReviewForm() {
  const t = useTranslations('Site.reviews');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) { setError(t('errName')); return; }
    if (review.trim().length < 5) { setError(t('errReview')); return; }
    if (phone && !/^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))) {
      setError(t('errPhone')); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          event_type: eventType,
          rating,
          review: review.trim(),
          website: honeypot,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Tokens are single-use: get a fresh one before the user retries.
        setTurnstileToken('');
        setTurnstileKey((k) => k + 1);
        throw new Error(data.error || t('errGeneric'));
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-[28px] bg-[var(--site-leaf-deep)] p-9 text-[var(--site-on-dark)]" role="status">
        <h3 className="s-h3">{t('thanks')}</h3>
        <p className="mt-3 text-[1rem] leading-relaxed text-[var(--site-on-dark-soft)]">{t('thanksBody')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-[var(--site-paper)] p-7 md:p-9">
      <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t('formTitle')}</h3>

      <form onSubmit={handleSubmit} className="relative mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="rv-name" className="s-label">
            {t('name')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
          </label>
          <input
            id="rv-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t('namePh')} className="s-field" required autoComplete="name"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="rv-phone" className="s-label">{t('phone')}</label>
            <input
              id="rv-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="9XXXXXXXXX" className="s-field" autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="rv-event" className="s-label">{t('eventType')}</label>
            <select id="rv-event" value={eventType} onChange={(e) => setEventType(e.target.value)} className="s-field">
              <option value="">{t('select')}</option>
              {EVENT_TYPES.map((v) => (
                <option key={v} value={v}>{t(`events.${v}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="s-label">
            {t('rating')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
          </legend>
          <div className="flex gap-1" role="radiogroup" aria-label={t('rating')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n} type="button" role="radio" aria-checked={rating === n}
                onClick={() => setRating(n)}
                aria-label={t('stars', { n })}
                className={`grid h-11 w-11 place-items-center rounded-full text-[1.7rem] transition-colors hover:bg-[var(--site-field)] ${
                  n <= rating ? 'text-[var(--site-brass)]' : 'text-[#D9CCB2]'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="rv-review" className="s-label">
            {t('review')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
          </label>
          <textarea
            id="rv-review" rows={4} value={review} onChange={(e) => setReview(e.target.value)}
            placeholder={t('reviewPh')} className="s-field resize-none" required
          />
        </div>

        {/* Honeypot — invisible to people and screen readers; bots fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="rv-website">Website</label>
          <input
            id="rv-website" type="text" name="website" tabIndex={-1} autoComplete="off"
            value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />

        {error && (
          <p className="rounded-xl bg-[#F6DDD3] px-4 py-3 text-[0.95rem] text-[var(--site-chilli)]" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="s-btn s-btn-primary w-full">
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}
