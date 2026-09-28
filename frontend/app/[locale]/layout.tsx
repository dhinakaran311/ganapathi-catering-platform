import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Playfair_Display, Noto_Sans, Noto_Sans_Tamil } from 'next/font/google';
import StickyQuoteButton from '@/components/shared/StickyQuoteButton';
import "../globals.css";

const locales = ['ta', 'en'];

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-tamil',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Shri Ganapathi Mess - Best Catering in Tiruppur | 100-500 Persons",
  description: "Traditional home-style catering in Tiruppur for weddings, corporate events & family functions. Free delivery within 5km. 10+ years experience. Serving 100-500 guests. Call: 9942351280.",
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
  authors: [{ name: "Shri Ganapathi Mess" }],
  openGraph: {
    title: "Shri Ganapathi Mess - Traditional Home-Style Catering, Tiruppur",
    description: "Traditional home-style catering for weddings, family functions, corporate events. 100-500 guests. Free delivery within 15km. 10+ years. Call 9942351280.",
    type: "website",
    locale: "ta_IN",
    alternateLocale: "en_IN",
    siteName: "Shri Ganapathi Mess",
  },
  robots: {
    index: true,
    follow: true,
  },
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

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${playfair.variable} ${notoSans.variable} ${notoSansTamil.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <StickyQuoteButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
