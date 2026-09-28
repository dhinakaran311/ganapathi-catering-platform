// app/admin/login/layout.tsx — Standalone layout for login page
// Bypasses the auth-guarded AdminLayout

import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans } from 'next/font/google';
import '../../globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Admin Login — Shri Ganapathi Mess',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${notoSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
