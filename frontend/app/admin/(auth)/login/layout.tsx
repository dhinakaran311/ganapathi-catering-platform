// app/admin/(auth)/login/layout.tsx — Standalone root layout for the login page
// Lives in the "(auth)" route group (not part of the URL), so it is NOT nested
// inside the auth-guarded admin panel layout in "(panel)".
// Always light: the login screen is styled for the light palette only.

import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans } from 'next/font/google';
import '@/app/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Admin Login — Shri Ganapathi Mess',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${playfair.variable} ${notoSans.variable}`}
    >
      <body className="bg-[var(--color-ivory-200)] text-[var(--color-brown-900)] antialiased">
        {children}
      </body>
    </html>
  );
}
