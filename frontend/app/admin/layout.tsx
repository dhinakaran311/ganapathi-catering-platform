// app/admin/layout.tsx — E36: Admin panel shell layout (Mobile Responsive)
// This layout wraps ALL /admin/* pages EXCEPT /admin/login (which has its own layout).
// The sidebar is deep green (#0D2611), topbar is ivory with brand tokens.
// Mobile: Hamburger menu to toggle sidebar

import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import '../globals.css';

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
  title: 'Admin — Shri Ganapathi Mess',
  description: 'Internal admin panel for Shri Ganapathi Mess catering management.',
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  // Middleware handles unauthenticated redirects.
  // Fetch user + role here for layout display (role badge, nav visibility).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { role } = await getCurrentUserWithRole();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${notoSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-ivory-200)] text-[var(--color-brown-900)]">
        <AdminLayoutClient user={user} role={role}>
          {children}
        </AdminLayoutClient>
      </body>
    </html>
  );
}
