'use client';

// components/home/Contact.tsx — Enquiry form + direct contact (#contact).
// Submit flow: open the WhatsApp tab (inside the tap), save to /api/enquiries
// (honeypot + Turnstile) waiting up to SAVE_WAIT_MS for the tracking code,
// send the WhatsApp message (with "To track: <link>" when the code arrived),
// clear the autosaved draft and show the confirmation.


import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { generateWhatsAppMessage, buildWhatsAppUrl, buildTrackingUrl } from '@/lib/whatsapp';
import { track } from '@/lib/analytics/track';
import TurnstileWidget from '@/components/shared/TurnstileWidget';
import { Phone } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import { WhatsAppIcon } from '@/components/site/icons';
import { SITE } from '@/lib/site';

interface ContactFormData {
  name: string;
  phone: string;
  event: string;
  guests: string;
  eventDate: string;
  eventLocation: string;
  foodType: string;
  customItems: string;
  message: string;
}

const FORM_STORAGE_KEY = 'sgm_enquiry_form';
// Last tracking code, kept on this device so the customer can find it again.
const LAST_TRACKING_KEY = 'sgm_last_tracking_code';
// How long to wait for the save so the tracking link can go into WhatsApp.
const SAVE_WAIT_MS = 5000;

// Option VALUES are sent to WhatsApp / the API exactly as before.
const EVENT_OPTIONS = [
  'Wedding / திருமணம்',
  'Ear Piercing / காதுகுத்து',
  'Engagement / நிச்சயம்',
  'House Warming / புதுமனை',
  'Baby Shower / சீமந்தம்',
  'Birthday / பிறந்தநாள்',
  'Family Function / குடும்ப விழா',
  'Corporate / கார்ப்பரேட்',
  'School / College Event',
  'Temple Function / கோவில் நிகழ்ச்சி',
  'Bulk Order / மொத்த ஆர்டர்',
];
const GUEST_OPTIONS = ['30-50', '50-100', '100-200', '200-300', '300-500', '500+'];

/** Today's date (YYYY-MM-DD) in the visitor's own time zone. */
function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

const defaultForm: ContactFormData = {
  name: '',
  phone: '',
  event: '',
  guests: '',
  eventDate: '',
  eventLocation: '',
  foodType: '',
  customItems: '',
  message: '',
};

export default function Contact() {
  const t = useTranslations('Contact');
  const locale = useLocale();
  const s = useTranslations('Site.contact');
  const [formData, setFormData] = useState<ContactFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Spam protection — kept out of formData so it is never saved to localStorage.
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0); // remount → fresh token
  // Tracking code returned by /api/enquiries, shown in the confirmation.
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [codeState, setCodeState] = useState<'idle' | 'pending' | 'ready' | 'none'>('idle');
  const [copied, setCopied] = useState(false);
  // Set only if the browser blocked the WhatsApp tab — shown as a button.
  const [pendingWaUrl, setPendingWaUrl] = useState<string | null>(null);
  const autoCloseRef = useRef<number | null>(null);

  // B11: Auto-save form to localStorage while filling
  useEffect(() => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({ ...defaultForm, ...JSON.parse(saved) });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const hasData = Object.values(formData).some((v) => v !== '');
    if (hasData) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Analytics (fire-and-forget — never blocks the flow)
    track({ event: 'enquiry_submit', metadata: { event_type: formData.event, food_type: formData.foodType } });

    // 1️⃣ Open the WhatsApp tab NOW, inside the tap — browsers block pop-ups
    // opened after an await. It is pointed at the chat once the message is ready.
    let tab: Window | null = null;
    try { tab = window.open('', '_blank'); } catch { tab = null; }

    // 2️⃣ Save to Supabase, waiting at most SAVE_WAIT_MS so the tracking code
    // and link can go into the WhatsApp message. A slow or failed save never
    // blocks the customer — the message is then sent without them.
    setTrackingCode(null);
    setCodeState('pending');
    setPendingWaUrl(null);
    const data = { ...formData };
    const save = fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        website: honeypot,
        turnstileToken: turnstileToken || undefined,
      }),
    })
      .then(async (res) => {
        if (res.ok) return (await res.json()) as { tracking_code?: string };
        // Never shown to the customer, but visible in the browser console so
        // a broken save can't go unnoticed again.
        const detail = await res.text().catch(() => '');
        console.error(`[Contact] enquiry save failed: HTTP ${res.status}`, detail);
        return null;
      })
      .then((json) => {
        const code = json?.tracking_code ?? null;
        if (code) {
          setTrackingCode(code);
          setCodeState('ready');
          // A code is worth keeping on screen — cancel the auto-close.
          if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
          try { localStorage.setItem(LAST_TRACKING_KEY, code); } catch { /* storage unavailable */ }
        } else {
          setCodeState('none');
        }
        return code;
      })
      .catch((err) => {
        // Silently log — never surface errors to the customer
        setCodeState('none');
        console.error('[Contact] enquiry save failed:', err);
        return null;
      });
    const code = await Promise.race([
      save,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), SAVE_WAIT_MS)),
    ]);

    // 3️⃣ Build the WhatsApp message (with the tracking code + link when saved)
    const message = generateWhatsAppMessage({
      name: data.name,
      phone: data.phone,
      event: data.event,
      guests: data.guests,
      eventDate: data.eventDate,
      eventLocation: data.eventLocation,
      foodType: data.foodType,
      customItems: data.customItems,
      message: data.message,
      ...(code ? { trackingCode: code, trackingUrl: buildTrackingUrl(window.location.origin, locale, code) } : {}),
    });
    const whatsappUrl = buildWhatsAppUrl(message);

    // 4️⃣ Open the chat (in the tab opened above; if the browser blocked that,
    // try once more, else offer a tap-to-open button in the confirmation).
    track({ event: 'whatsapp_open', metadata: { source: 'contact_form' } });
    let blocked = false;
    if (tab && !tab.closed) {
      tab.location.href = whatsappUrl;
    } else if (!window.open(whatsappUrl, '_blank')) {
      blocked = true;
      setPendingWaUrl(whatsappUrl);
    }

    // 5️⃣ Clear form + show success popup
    localStorage.removeItem(FORM_STORAGE_KEY);
    setFormData(defaultForm);
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1); // tokens are single-use
    setIsSubmitting(false);
    setShowSuccess(true);
    // Auto-close popup after 6 seconds — unless there is a tracking code or a
    // WhatsApp button to show (a late code also cancels it, see above).
    if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
    if (!code && !blocked) {
      autoCloseRef.current = window.setTimeout(() => setShowSuccess(false), 6000);
    }
  };

  const copyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the code is still visible */ }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const card = (label: string, children: React.ReactNode) => (
    <div>
      <dt className="text-[0.85rem] font-semibold text-[var(--site-on-dark-soft)]">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-[1.02rem] leading-relaxed text-[var(--site-on-dark)]">{children}</dd>
    </div>
  );

  return (
    <section id="contact" aria-labelledby="contact-title" className="s-section s-deep">
      <div className="s-container">
        <Reveal className="max-w-[760px]">
          <h2 id="contact-title" className="s-h2 text-[var(--site-leaf-deep)]">{t('heading')}</h2>
          <p className="s-lead mt-5">{t('subheading')}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Enquiry form */}
          <Reveal className="rounded-[28px] bg-[var(--site-paper)] p-6 sm:p-8 md:p-10">
            <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t('formTitle')}</h3>

            <form onSubmit={handleSubmit} className="relative mt-7 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="s-label">
                  {t('form.name')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
                </label>
                <input
                  type="text" id="name" name="name" required autoComplete="name"
                  value={formData.name} onChange={handleChange}
                  placeholder={t('form.placeholders.name')} className="s-field"
                />
              </div>

              <div>
                <label htmlFor="phone" className="s-label">
                  {t('form.phone')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
                </label>
                <input
                  type="tel" id="phone" name="phone" required inputMode="tel" autoComplete="tel"
                  value={formData.phone} onChange={handleChange}
                  placeholder={t('form.placeholders.phone')} className="s-field"
                />
              </div>

              <div>
                <label htmlFor="event" className="s-label">
                  {t('form.event')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
                </label>
                <select id="event" name="event" required value={formData.event} onChange={handleChange} className="s-field">
                  <option value="">{t('form.placeholders.event')}</option>
                  {EVENT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="guests" className="s-label">
                  {t('form.guests')} <span aria-hidden="true" className="text-[var(--site-chilli)]">*</span>
                </label>
                <select id="guests" name="guests" required value={formData.guests} onChange={handleChange} className="s-field">
                  <option value="">{t('form.placeholders.guests')}</option>
                  {GUEST_OPTIONS.map((v) => <option key={v} value={v}>{v.replace('-', ' – ')}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="foodType" className="s-label">{t('form.foodType')}</label>
                <select id="foodType" name="foodType" value={formData.foodType} onChange={handleChange} className="s-field">
                  <option value="">{s('select')}</option>
                  <option value="Vegetarian">{s('veg')}</option>
                  <option value="Non-Vegetarian">{s('nonveg')}</option>
                  <option value="Both">{s('both')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="eventDate" className="s-label">{t('form.eventDate')}</label>
                <input
                  type="date" id="eventDate" name="eventDate"
                  value={formData.eventDate} onChange={handleChange}
                  min={todayLocal()} suppressHydrationWarning
                  className="s-field"
                />
              </div>

              <div>
                <label htmlFor="eventLocation" className="s-label">{t('form.eventLocation')}</label>
                <input
                  type="text" id="eventLocation" name="eventLocation" autoComplete="address-level2"
                  value={formData.eventLocation} onChange={handleChange}
                  placeholder={t('form.placeholders.eventLocation')} className="s-field"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="customItems" className="s-label">{t('form.customItems')}</label>
                <input
                  type="text" id="customItems" name="customItems"
                  value={formData.customItems} onChange={handleChange}
                  placeholder={t('form.placeholders.customItems')} className="s-field"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className="s-label">{t('form.message')}</label>
                <textarea
                  id="message" name="message" rows={3}
                  value={formData.message} onChange={handleChange}
                  placeholder={t('form.placeholders.message')} className="s-field resize-none"
                />
              </div>

              {/* Honeypot — invisible to people and screen readers; bots fill it. */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                  type="text" id="contact-website" name="website"
                  tabIndex={-1} autoComplete="off"
                  value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />
                <button type="submit" disabled={isSubmitting} className="s-btn s-btn-primary s-wa w-full">
                  <WhatsAppIcon size={20} />
                  {isSubmitting ? s('sending') : t('form.submit')}
                </button>
                <p className="mt-3 text-center text-[0.88rem] text-[var(--site-ink-muted)]">{t('form.note')}</p>
                <p className="mt-4 text-center text-[0.95rem] text-[var(--site-ink-soft)]">
                  {s('trackExisting')}{' '}
                  <a href={`/${locale}/track`} className="font-semibold text-[var(--site-leaf-deep)] underline underline-offset-4">
                    {s('trackExistingLink')}
                  </a>
                </p>
              </div>
            </form>
          </Reveal>

          {/* Direct contact */}
          <Reveal delay={100} className="rounded-[28px] bg-[var(--site-leaf-deep)] p-7 sm:p-9 lg:sticky lg:top-[calc(var(--site-header)+32px)] lg:self-start">
            <h3 className="s-h3 text-[var(--site-on-dark)]">{t('cardHeading')}</h3>

            <div className="mt-6 grid gap-3">
              <a href={SITE.phoneTel} className="s-btn s-btn-on-dark justify-start">
                <Phone size={18} aria-hidden="true" />
                {SITE.phoneDisplay}
              </a>
              <a
                href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => track({ event: 'whatsapp_open', metadata: { source: 'contact_card' } })}
                className="s-btn s-btn-brass justify-start"
              >
                <WhatsAppIcon size={18} />
                {t('card.enquireNow')}
              </a>
            </div>

            <dl className="mt-9 grid gap-6">
              {card(t('card.address'), t('card.addressText'))}
              {card(t('card.hours'), t('card.hoursText'))}
              {card(t('card.capacity'), t('card.capacityText'))}
              {card(t('card.delivery'), t('card.deliveryText'))}
            </dl>
            <p className="mt-6 text-[0.88rem] leading-relaxed text-[var(--site-on-dark-soft)]">{t('areasNote')}</p>
          </Reveal>
        </div>
      </div>

      {/* Success dialog */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[900] flex items-end justify-center bg-[rgba(13,38,17,0.55)] p-4 sm:items-center"
          onClick={() => setShowSuccess(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-sent-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-[var(--site-paper)] p-8"
          >
            <h3 id="enquiry-sent-title" className="s-h3 text-[var(--site-leaf-deep)]">{s('successTitle')}</h3>
            <p className="mt-3 text-[1rem] leading-relaxed text-[var(--site-ink-soft)]">{s('successBody')}</p>

            {/* Only when the browser blocked the WhatsApp tab */}
            {pendingWaUrl && (
              <a
                href={pendingWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPendingWaUrl(null)}
                className="s-btn s-btn-primary s-wa mt-5 w-full"
              >
                <WhatsAppIcon size={19} />
                {s('openWhatsApp')}
              </a>
            )}

            {/* Tracking code (B13) — appears as soon as the save returns */}
            <div aria-live="polite">
              {codeState === 'pending' && (
                <p className="mt-5 text-[0.92rem] text-[var(--site-ink-muted)]">{s('gettingCode')}</p>
              )}
              {codeState === 'ready' && trackingCode && (
                <div className="mt-5 rounded-2xl bg-[var(--site-paper-deep)] p-5">
                  <p className="text-[0.88rem] font-semibold text-[var(--site-ink-muted)]">{s('trackingLabel')}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                    <span className="s-serif text-[1.7rem] font-semibold tracking-[0.12em] text-[var(--site-leaf-deep)]">
                      {trackingCode}
                    </span>
                    <button type="button" onClick={copyCode} className="s-btn s-btn-outline min-h-[40px] px-4 text-[0.88rem]">
                      {copied ? s('copied') : s('copy')}
                    </button>
                  </div>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--site-ink-soft)]">{s('trackingHint')}</p>
                  <Link
                    href={`/${locale}/track/${trackingCode}`}
                    className="s-link mt-3 inline-block text-[var(--site-leaf)]"
                  >
                    {s('trackLink')}
                  </Link>
                </div>
              )}
            </div>

            <Link href={`/${locale}/quote/success`} className="s-link mt-5 inline-block text-[var(--site-leaf)]">
              {s('next')}
            </Link>
            <button
              type="button"
              autoFocus
              onClick={() => setShowSuccess(false)}
              className="s-btn s-btn-primary mt-7 w-full"
            >
              {s('ok')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
