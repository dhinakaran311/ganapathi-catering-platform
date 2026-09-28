'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { generateWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

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
  const [formData, setFormData] = useState<ContactFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // B11: Auto-save form to localStorage while filling
  useEffect(() => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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

    // B11: Clear saved form after submission
    localStorage.removeItem(FORM_STORAGE_KEY);
    setFormData(defaultForm);

    window.open(whatsappUrl, '_blank');

    // Clear form + show success popup
    localStorage.removeItem(FORM_STORAGE_KEY);
    setFormData(defaultForm);
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

  return (
    <section id="contact" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">

        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] mb-3">
            {t('heading')}
          </h2>
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)] italic">
            {t('subheading')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">

          {/* Left Column — Service Areas + Form */}
          <div className="space-y-8">

            {/* Service Areas */}
            <div className="bg-[var(--color-ivory-100)] rounded-2xl p-6 md:p-8 border border-[var(--color-ivory-300)]">
              <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-3">
                {t('areasTitle')}
              </h3>
              <p className="font-body text-sm md:text-base text-[var(--color-brown-600)] mb-4">
                {t('areasDesc')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(t.raw('areas') as string[]).map((area, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg px-4 py-3 font-body text-sm text-[var(--color-brown-700)] border border-[var(--color-ivory-300)]"
                  >
                    {area}
                  </div>
                ))}
              </div>
              <p className="font-body text-xs text-[var(--color-brown-500)] italic mt-4">
                {t('areasNote')}
              </p>
            </div>

            {/* Contact Form */}
            <div className="bg-[var(--color-ivory-100)] rounded-2xl p-6 md:p-8 border border-[var(--color-ivory-300)]">
              <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-6">
                {t('formTitle')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" id="name" name="name" required
                    value={formData.name} onChange={handleChange}
                    placeholder={t('form.placeholders.name')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel" id="phone" name="phone" required
                    value={formData.phone} onChange={handleChange}
                    placeholder={t('form.placeholders.phone')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label htmlFor="event" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.event')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="event" name="event" required
                    value={formData.event} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  >
                    <option value="">{t('form.placeholders.event')}</option>
                    <option value="Wedding / திருமணம்">Wedding / திருமணம்</option>
                    <option value="Ear Piercing / காதுகுத்து">Ear Piercing / காதுகுத்து</option>
                    <option value="Engagement / நிச்சயம்">Engagement / நிச்சயம்</option>
                    <option value="House Warming / புதுமனை">House Warming / புதுமனை</option>
                    <option value="Baby Shower / சீமந்தம்">Baby Shower / சீமந்தம்</option>
                    <option value="Birthday / பிறந்தநாள்">Birthday / பிறந்தநாள்</option>
                    <option value="Family Function / குடும்ப விழா">Family Function / குடும்ப விழா</option>
                    <option value="Corporate / கார்ப்பரேட்">Corporate / கார்ப்பரேட்</option>
                    <option value="School / College Event">School / College Event</option>
                    <option value="Temple Function / கோவில் நிகழ்ச்சி">Temple Function / கோவில் நிகழ்ச்சி</option>
                    <option value="Bulk Order / மொத்த ஆர்டர்">Bulk Order / மொத்த ஆர்டர்</option>
                  </select>
                </div>

                {/* Guests + Food Type row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guests" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                      {t('form.guests')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="guests" name="guests" required
                      value={formData.guests} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                    >
                      <option value="">{t('form.placeholders.guests')}</option>
                      <option value="30-50">30 – 50</option>
                      <option value="50-100">50 – 100</option>
                      <option value="100-200">100 – 200</option>
                      <option value="200-300">200 – 300</option>
                      <option value="300-500">300 – 500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="foodType" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                      {t('form.foodType')}
                    </label>
                    <select
                      id="foodType" name="foodType"
                      value={formData.foodType} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Vegetarian">🌱 Vegetarian</option>
                      <option value="Non-Vegetarian">🍗 Non-Vegetarian</option>
                      <option value="Both">🌱🍗 Both</option>
                    </select>
                  </div>
                </div>

                {/* Event Date + Location row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                      {t('form.eventDate')}
                    </label>
                    <input
                      type="date" id="eventDate" name="eventDate"
                      value={formData.eventDate} onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="eventLocation" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                      {t('form.eventLocation')}
                    </label>
                    <input
                      type="text" id="eventLocation" name="eventLocation"
                      value={formData.eventLocation} onChange={handleChange}
                      placeholder={t('form.placeholders.eventLocation')}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Custom items (D25) */}
                <div>
                  <label htmlFor="customItems" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.customItems')}
                  </label>
                  <input
                    type="text" id="customItems" name="customItems"
                    value={formData.customItems} onChange={handleChange}
                    placeholder={t('form.placeholders.customItems')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.message')}
                  </label>
                  <textarea
                    id="message" name="message" rows={3}
                    value={formData.message} onChange={handleChange}
                    placeholder={t('form.placeholders.message')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[#25D366] text-white transition-all hover:bg-[#1da851] hover:-translate-y-px shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>💬</span>
                  {isSubmitting ? 'Opening WhatsApp...' : t('form.submit')}
                </button>

                <p className="font-body text-xs text-center text-[var(--color-brown-500)]">
                  {t('form.note')}
                </p>
              </form>
            </div>
          </div>

          {/* Right Column — Contact Info Card */}
          <div>
            <div className="sticky top-8 bg-gradient-to-br from-[var(--color-green-900)] to-[var(--color-green-800)] rounded-2xl p-8 md:p-10 text-white shadow-xl">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-8">
                {t('cardHeading')}
              </h3>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">📞</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.phone')}</div>
                    <a href="tel:+919942351280" className="font-body text-lg font-semibold text-white hover:text-[var(--color-gold-300)] transition-colors">
                      +91 99423 51280
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">💬</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.whatsapp')}</div>
                    <a href="https://wa.me/919942351280" target="_blank" rel="noopener noreferrer" className="font-body text-lg font-semibold text-white hover:text-[var(--color-gold-300)] transition-colors">
                      +91 99423 51280
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">📍</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.address')}</div>
                    <p className="font-body text-base text-white leading-relaxed whitespace-pre-line">
                      {t('card.addressText')}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">⏰</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.hours')}</div>
                    <p className="font-body text-base text-white leading-relaxed whitespace-pre-line">
                      {t('card.hoursText')}
                    </p>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">👥</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.capacity')}</div>
                    <p className="font-body text-base text-white leading-relaxed">
                      {t('card.capacityText')}
                    </p>
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">🚚</div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">{t('card.delivery')}</div>
                    <p className="font-body text-sm text-white leading-relaxed">
                      {t('card.deliveryText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <a
                href="https://wa.me/919942351280"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-white text-[var(--color-green-900)] transition-all hover:bg-[var(--color-gold-200)] hover:-translate-y-px shadow-sm hover:shadow-md"
              >
                💬 {t('card.enquireNow')}
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Success Popup Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 text-[var(--color-brown-400)] hover:text-[var(--color-brown-900)] text-2xl leading-none"
            >
              &times;
            </button>
            <div className="w-16 h-16 rounded-full bg-[var(--color-green-100)] flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
              ✅
            </div>
            <h3 className="font-display text-2xl font-bold text-[var(--color-brown-900)] text-center mb-2">
              Enquiry Sent!
            </h3>
            <p className="font-body text-sm text-[var(--color-brown-600)] text-center mb-6">
              WhatsApp opened on your device. Just hit send, and we will reply with a quote within 2 hours.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full h-12 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
