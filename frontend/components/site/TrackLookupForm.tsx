'use client';

// components/site/TrackLookupForm.tsx — "Track your enquiry" code entry.
// Sends the customer to /[locale]/track/<CODE>. If they sent an enquiry from
// this device before, the code saved by the contact form is filled in.

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

// Same key the contact form writes (components/home/Contact.tsx).
const LAST_TRACKING_KEY = 'sgm_last_tracking_code';
const CODE_RE = /^[A-Z0-9]{6,12}$/;

const clean = (v: string) => v.replace(/[^a-z0-9]/gi, '').toUpperCase();

const noopSubscribe = () => () => {};
function readSavedCode(): string {
  try {
    const saved = clean(localStorage.getItem(LAST_TRACKING_KEY) ?? '');
    return CODE_RE.test(saved) ? saved : '';
  } catch {
    return ''; // storage unavailable
  }
}

export default function TrackLookupForm({
  locale,
  initialCode = '',
}: {
  locale: string;
  initialCode?: string;
}) {
  const t = useTranslations('Site.trackLookup');
  const router = useRouter();
  // Last code saved on this device ('' on the server / when unavailable).
  const saved = useSyncExternalStore(noopSubscribe, readSavedCode, () => '');
  // null until the customer types; until then show the given or saved code.
  const [typed, setTyped] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  const given = clean(initialCode);
  const code = typed ?? (given || saved);
  const fromDevice = typed === null && !given && saved !== '';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = clean(code);
    if (!CODE_RE.test(value)) {
      setInvalid(true);
      return;
    }
    setBusy(true);
    router.push(`/${locale}/track/${value}`);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8">
      <label htmlFor="tracking-code" className="s-label">{t('label')}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="tracking-code"
          name="code"
          value={code}
          onChange={(e) => {
            setTyped(clean(e.target.value));
            setInvalid(false);
          }}
          placeholder={t('placeholder')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'tracking-code-error' : fromDevice ? 'tracking-code-hint' : undefined}
          className="s-field font-semibold tracking-[0.14em] sm:flex-1"
        />
        <button type="submit" disabled={busy} className="s-btn s-btn-primary sm:flex-none">
          <Search size={18} aria-hidden="true" />
          {t('submit')}
        </button>
      </div>
      {invalid && (
        <p id="tracking-code-error" role="alert" className="mt-3 text-[0.92rem] text-[var(--site-chilli)]">
          {t('invalid')}
        </p>
      )}
      {!invalid && fromDevice && (
        <p id="tracking-code-hint" className="mt-3 text-[0.92rem] text-[var(--site-ink-muted)]">
          {t('saved')}
        </p>
      )}
    </form>
  );
}
