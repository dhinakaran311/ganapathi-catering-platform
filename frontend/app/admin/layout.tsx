// app/admin/layout.tsx — E36: Admin panel shell layout
// This layout wraps ALL /admin/* pages EXCEPT /admin/login (which has its own layout).
// The sidebar is deep green (#0D2611), topbar is ivory with brand tokens.

import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/Sidebar';
import NotificationBell from '@/components/admin/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already handles the redirect for unauthenticated requests.
  // We still fetch the user here for display purposes.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${notoSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-ivory-200)] text-[var(--color-brown-900)]">
        {user ? (
          <div className="flex min-h-screen">
            {/* Fixed sidebar */}
            <AdminSidebar />

            {/* Main content — offset by sidebar width */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
              {/* Top bar */}
              <header
                id="admin-topbar"
                className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white border-b border-[var(--color-ivory-300)] shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-base font-bold text-[var(--color-brown-900)]">
                    Shri Ganapathi Mess
                  </h1>
                  <span className="hidden sm:inline font-body text-xs text-[var(--color-brown-400)] px-2 py-0.5 rounded-full bg-[var(--color-ivory-200)]">
                    Admin
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <NotificationBell />
                  <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[var(--color-ivory-300)]">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-body"
                      style={{ backgroundColor: 'var(--color-green-800)' }}
                    >
                      {user.email?.charAt(0).toUpperCase() ?? 'A'}
                    </div>
                    <span className="hidden sm:block font-body text-sm font-medium text-[var(--color-brown-700)]">
                      {user.email?.split('@')[0] ?? 'Admin'}
                    </span>
                  </div>
                </div>
              </header>

              {/* Page content */}
              <main className="flex-1 p-6 md:p-8">
                {children}
              </main>

              <footer className="px-6 py-4 border-t border-[var(--color-ivory-300)] bg-white">
                <p className="font-body text-xs text-[var(--color-brown-400)] text-center">
                  © {new Date().getFullYear()} Shri Ganapathi Mess · Admin Panel · Internal Use Only
                </p>
              </footer>
            </div>
          </div>
        ) : (
          // Unauthenticated state — render children directly (login page handles its own UI)
          children
        )}
      </body>
    </html>
  );
}
