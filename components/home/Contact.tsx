'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function Contact() {
  const t = useTranslations('Contact');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    event: '',
    guests: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct WhatsApp message
    const message = `
🌿 *New Enquiry - Sri Ganapathi Mess*

👤 *Name:* ${formData.name}
📱 *Phone:* ${formData.phone}
🎉 *Event:* ${formData.event}
👥 *Guests:* ${formData.guests}
${formData.message ? `\n💬 *Message:*\n${formData.message}` : ''}
    `.trim();

    const whatsappUrl = `https://wa.me/919942351280?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
          
          {/* Left Column - Form & Service Areas */}
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
                <div>
                  <label htmlFor="name" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.name')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.phone')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.phone')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="event" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.event')}
                  </label>
                  <select
                    id="event"
                    name="event"
                    required
                    value={formData.event}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  >
                    <option value="">{t('form.placeholders.event')}</option>
                    <option value="Wedding">Wedding / திருமணம்</option>
                    <option value="Birthday">Birthday / பிறந்தநாள்</option>
                    <option value="Corporate">Corporate / கார்ப்பரேட்</option>
                    <option value="Family Function">Family Function / குடும்ப விழா</option>
                    <option value="Community Event">Community Event / சமூக நிகழ்ச்சி</option>
                    <option value="Bulk Order">Bulk Order / பல்க் ஆர்டர்</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="guests" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.guests')}
                  </label>
                  <select
                    id="guests"
                    name="guests"
                    required
                    value={formData.guests}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                  >
                    <option value="">{t('form.placeholders.guests')}</option>
                    <option value="30-50">30-50</option>
                    <option value="50-100">50-100</option>
                    <option value="100-200">100-200</option>
                    <option value="200-300">200-300</option>
                    <option value="300-500">300-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2">
                    {t('form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.message')}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[var(--color-green-800)] text-white transition-all hover:bg-[var(--color-green-900)] hover:-translate-y-px shadow-sm hover:shadow-md"
                >
                  {t('form.submit')}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Contact Info Card */}
          <div>
            <div className="sticky top-8 bg-gradient-to-br from-[var(--color-green-900)] to-[var(--color-green-800)] rounded-2xl p-8 md:p-10 text-white shadow-xl">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-8">
                {t('cardHeading')}
              </h3>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    📞
                  </div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">
                      {t('card.phone')}
                    </div>
                    <a
                      href="tel:+919942351280"
                      className="font-body text-lg font-semibold text-white hover:text-[var(--color-gold-300)] transition-colors"
                    >
                      +91 99423 51280
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    💬
                  </div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">
                      {t('card.whatsapp')}
                    </div>
                    <a
                      href="https://wa.me/919942351280"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-lg font-semibold text-white hover:text-[var(--color-gold-300)] transition-colors"
                    >
                      +91 99423 51280
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    📍
                  </div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">
                      {t('card.address')}
                    </div>
                    <p className="font-body text-base text-white leading-relaxed whitespace-pre-line">
                      {t('card.addressText')}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    ⏰
                  </div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">
                      {t('card.hours')}
                    </div>
                    <p className="font-body text-base text-white leading-relaxed whitespace-pre-line">
                      {t('card.hoursText')}
                    </p>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    👥
                  </div>
                  <div>
                    <div className="font-body text-sm font-semibold text-white/70 mb-1">
                      {t('card.capacity')}
                    </div>
                    <p className="font-body text-base text-white leading-relaxed">
                      {t('card.capacityText')}
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
                {t('card.enquireNow')}
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
