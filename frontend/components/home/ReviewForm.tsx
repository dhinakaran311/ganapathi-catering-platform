// components/home/ReviewForm.tsx
// J71: Client form for submitting a public review. Posts to /api/reviews and
// shows an inline success message. The review appears after admin approval.

'use client';

import { useState } from 'react';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate', 'Family Function', 'Engagement',
  'House Warming', 'Baby Shower', 'Other',
];

export default function ReviewForm() {
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

    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    if (review.trim().length < 5) { setError('Please write a short review (at least 5 characters).'); return; }
    if (phone && !/^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))) {
      setError('Please enter a valid 10-digit mobile number, or leave it blank.'); return;
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
        throw new Error(data.error || 'Submission failed');
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] p-8 text-center shadow-sm h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-green-100)] flex items-center justify-center mx-auto mb-4 text-3xl">
          🙏
        </div>
        <h3 className="font-display text-xl font-bold text-[var(--color-brown-900)] mb-2">
          Thank you!
        </h3>
        <p className="font-body text-sm text-[var(--color-brown-600)]">
          Your review has been submitted and will appear here once approved.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent';

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] p-6 md:p-8 shadow-sm h-full">
      <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-6">
        Share your experience
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rv-name" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="rv-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Murugan K." className={inputClass} required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rv-phone" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
              Phone (optional)
            </label>
            <input
              id="rv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="9XXXXXXXXX" className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rv-event" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
              Event type
            </label>
            <select id="rv-event" value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <span className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
            Rating <span className="text-red-500">*</span>
          </span>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n} type="button" role="radio" aria-checked={rating === n}
                onClick={() => setRating(n)}
                className={`text-2xl transition-colors ${n <= rating ? 'text-[var(--color-gold-500)]' : 'text-[var(--color-ivory-400)]'}`}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="rv-review" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
            Your review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rv-review" rows={4} value={review} onChange={(e) => setReview(e.target.value)}
            placeholder="How was the food and service?" className={`${inputClass} resize-none`} required
          />
        </div>

        {/* Honeypot — invisible to people and screen readers; bots fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden">
          <label htmlFor="rv-website">Website</label>
          <input
            id="rv-website" type="text" name="website" tabIndex={-1} autoComplete="off"
            value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />

        {error && (
          <p className="font-body text-sm text-red-600" role="alert">{error}</p>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
