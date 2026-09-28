// app/[locale]/quote/success/page.tsx — B14: Thank-you page shown after WhatsApp opens

import Link from 'next/link';

export default function QuoteSuccessPage() {
  return (
    <main className="min-h-screen bg-[var(--color-ivory-200)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[var(--color-green-100)] flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
          ✅
        </div>

        {/* Heading */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-brown-900)] mb-3">
          Enquiry Sent!
        </h1>
        <p className="font-display text-xl text-[var(--color-brown-600)] mb-6">
          விசாரிப்பு அனுப்பப்பட்டது!
        </p>

        {/* Instructions card */}
        <div className="bg-white rounded-2xl border border-[var(--color-ivory-300)] shadow-sm p-6 mb-8 text-left space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            What happens next?
          </h2>
          <ol className="space-y-3">
            {[
              { step: '1', en: 'WhatsApp should have opened on your phone — just tap Send.', ta: 'உங்கள் தொலைபேசியில் WhatsApp திறந்திருக்கும் — அனுப்பு அழுத்துங்கள்.' },
              { step: '2', en: 'We reply within 2 hours with a custom quote.', ta: '2 மணி நேரத்திற்குள் விலை மேற்கோளுடன் பதிலளிப்போம்.' },
              { step: '3', en: 'Once confirmed, pay a small advance to book your date.', ta: 'தேதியை உறுதிப்படுத்த சிறிய முன்பணம் செலுத்துங்கள்.' },
            ].map(({ step, en, ta }) => (
              <li key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-green-800)] text-white font-body text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="font-body text-sm text-[var(--color-brown-800)]">{en}</p>
                  <p className="font-body text-xs text-[var(--color-brown-500)] italic mt-0.5">{ta}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* WhatsApp didn't open? */}
        <div className="bg-[var(--color-ivory-100)] rounded-xl border border-[var(--color-ivory-300)] p-4 mb-6">
          <p className="font-body text-xs text-[var(--color-brown-500)] mb-2">WhatsApp didn&apos;t open?</p>
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#25D366] hover:underline"
          >
            Open WhatsApp manually →
          </a>
        </div>

        {/* Back home */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 h-12 rounded-md font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors"
        >
          Back to Home
        </Link>

        <p className="font-body text-xs text-[var(--color-brown-400)] mt-4">
          Shri Ganapathi Mess · +91 99423 51280
        </p>
      </div>
    </main>
  );
}
