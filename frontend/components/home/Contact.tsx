'use client';

// components/home/Contact.tsx — Enquiry form + direct contact (#contact).
// The submit flow is unchanged: build the WhatsApp message, save to
// /api/enquiries in the background (honeypot + Turnstile), open WhatsApp,
// clear the autosaved draft and show the confirmation.


import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
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
    setIsSubmitting(true);

    // Analytics (fire-and-forget — never blocks the flow)
    track({ event: 'enquiry_submit', metadata: { event_type: formData.event, food_type: formData.foodType } });

    // 1️⃣ Build WhatsApp message (always happens, even if DB save fails)
    const message = generateWhatsAppMessage({
      name: formData.name,
      phone: formData.phone,
      event: formData.event,
      guests: formData.guests,
      eventDate: formData.eventDate,
      eventLocation: formData.eventLocation,
      foodType: formData.foodType,
      customItems: formData.customItems,
      message: formData.message,
    });
    const whatsappUrl = buildWhatsAppUrl(message);

    // 2️⃣ Save to Supabase in the background (fire-and-forget)
    // If this fails the WhatsApp flow is NOT blocked — customer experience is protected
    fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        event: formData.event,
        guests: formData.guests,
        eventDate: formData.eventDate,
        eventLocation: formData.eventLocation,
        foodType: formData.foodType,
        customItems: formData.customItems,
        message: formData.message,
        website: honeypot,
        turnstileToken: turnstileToken || undefined,
      }),
    }).catch((err) => {
      // Silently log — never surface errors to the customer
      console.error('[Contact] enquiry save failed:', err);
    });

    // 3️⃣ Open WhatsApp immediately (don't wait for DB)
    track({ event: 'whatsapp_open', metadata: { source: 'contact_form' } });
    window.open(whatsappUrl, '_blank');

    // 4️⃣ Clear form + show success popup
    localStorage.removeItem(FORM_STORAGE_KEY);
    setFormData(defaultForm);
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1); // tokens are single-use
    setIsSubmitting(false);
    setShowSuccess(true);
    // Auto-close popup after 6 seconds
    setTimeout(() => setShowSuccess(false), 6000);
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
                <button type="submit" disabled={isSubmitting} className="s-btn s-btn-primary w-full">
                  <WhatsAppIcon size={20} />
                  {isSubmitting ? s('sending') : t('form.submit')}
                </button>
                <p className="mt-3 text-center text-[0.88rem] text-[var(--site-ink-muted)]">{t('form.note')}</p>
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
