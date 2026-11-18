import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Fraunces, Noto_Serif_Tamil, Noto_Sans, Noto_Sans_Tamil } from 'next/font/google';
import StickyQuoteButton from '@/components/shared/StickyQuoteButton';
import { SiteBrandProvider } from '@/components/site/SiteBrand';
import { getSiteTheme } from '@/lib/theme-settings.server';
import { SITE } from '@/lib/site';
import "../globals.css";
import "./site.css";

const locales = ['ta', 'en'];

// Public-site type system (admin keeps its own fonts):
//   display  → Fraunces (Latin) + Noto Serif Tamil (Tamil glyphs)
//   body     → Noto Sans (Latin) + Noto Sans Tamil (Tamil glyphs)
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif-latin',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
});

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ['tamil'],
  variable: '--font-serif-tamil',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  variable: '--font-tamil',
  display: 'swap',
});

// Facts come from lib/site.ts so the description and Open Graph text can't
// disagree (OG previously said 15 km while everything else said 5 km).
const GUESTS = `${SITE.minGuests}-${SITE.maxGuests}`;

export const metadata: Metadata = {
  title: `${SITE.nameEn} - Best Catering in ${SITE.city} | ${GUESTS} Persons`,
  description: `Traditional home-style catering in ${SITE.city} for weddings, corporate events & family functions. Free delivery within ${SITE.freeDeliveryKm} km. ${SITE.yearsExperience} years experience. Serving ${GUESTS} guests. Call: ${SITE.phoneLocal}.`,
  keywords: [
    "Tiruppur catering",
    "bulk food order Tiruppur",
    "wedding catering Tiruppur",
    "corporate catering Tiruppur",
    "Ganapathi mess",
    "திருப்பூர் கேட்டரிங்",
    "வீட்டு சமையல் ஆர்டர்",
    "திருமண கேட்டரிங்",
    "function catering Tiruppur",
    "home style catering Tamil Nadu",
  ],
  authors: [{ name: SITE.nameEn }],
  openGraph: {
    title: `${SITE.nameEn} - Traditional Home-Style Catering, ${SITE.city}`,
    description: `Traditional home-style catering for weddings, family functions, corporate events. ${GUESTS} guests. Free delivery within ${SITE.freeDeliveryKm} km. ${SITE.yearsExperience} years. Call ${SITE.phoneLocal}.`,
    type: "website",
    locale: "ta_IN",
    alternateLocale: "en_IN",
    siteName: SITE.nameEn,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  // Admin → Settings → Theme (only customised values; defaults = as designed).
  const theme = await getSiteTheme();

  return (
    // The public site is always rendered in the light palette. Its components
    // are designed for light backgrounds (bg-white cards, text-white buttons),
    // so following the OS dark preference produced unreadable contrast for
    // dark-mode phone users. Dark mode remains available in the admin panel.
    <html
      lang={locale}
      dir="ltr"
      data-theme="light"
      className={`${fraunces.variable} ${notoSerifTamil.variable} ${notoSans.variable} ${notoSansTamil.variable}`}
    >
      <body className="site" style={theme.style}>
        <NextIntlClientProvider messages={messages}>
          <SiteBrandProvider logoUrl={theme.logoUrl}>
            {children}
            <StickyQuoteButton />
          </SiteBrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
