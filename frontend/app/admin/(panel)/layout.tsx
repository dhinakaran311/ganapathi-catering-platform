// app/admin/(panel)/layout.tsx — E36: Admin panel shell layout (Mobile Responsive)
// Root layout for every authenticated /admin/* page. The "(panel)" route group
// does not appear in the URL. /admin/login lives in the sibling "(auth)" group
// with its own root layout, so this layout's auth redirect can never apply to
// the login page itself (which previously caused an infinite redirect loop).
// The sidebar is deep green (#0D2611), topbar is ivory with brand tokens.
// Mobile: Hamburger menu to toggle sidebar
//
// Auth note: proxy.ts is the primary HTTP-layer guard for /admin/* routes
// (Next.js 16 uses proxy.ts instead of the deprecated middleware.ts).
// This layout performs a secondary server-side check as defence-in-depth.

import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans } from 'next/font/google';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { getMfaStatus } from '@/lib/auth/mfa';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { ThemeProvider } from '@/lib/theme';
import '@/app/globals.css';
import '@/app/admin-dark.css';

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

  // proxy.ts has already redirected unauthenticated users, but this is a
  // secondary defence-in-depth check in case the proxy is bypassed.
  if (!user) {
    redirect('/admin/login');
  }

  // Same for 2FA: enrolled users must have completed the TOTP step.
  const mfa = await getMfaStatus(supabase, user);
  if (!mfa.satisfied) {
    redirect('/admin/login?mfa=1');
  }

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${notoSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-ivory-200)] text-[var(--color-brown-900)]">
        {/* A3: apply the stored theme before paint to avoid a flash.
            Dark is opt-in only (chosen via the toggle); with no saved choice
            the panel stays light rather than following the OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sgm-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <AdminLayoutClient user={user} role={role}>
            {children}
          </AdminLayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
