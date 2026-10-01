// components/admin/AdminLayoutClient.tsx - Client-side layout wrapper for admin panel

'use client';

import { Menu } from 'lucide-react';
import AdminSidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ROLE_BADGE_COLORS, ROLE_LABELS, type StaffRole } from '@/types/staff';

interface AdminLayoutClientProps {
  user: {
    email?: string | null;
  } | null;
  role?: StaffRole | null;
  children: React.ReactNode;
}

function toggleMobileMenu() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('toggleMobileMenu'));
  }
}

export default function AdminLayoutClient({ user, role, children }: AdminLayoutClientProps) {
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={role ?? null} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header
          id="admin-topbar"
          className="sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-[var(--color-ivory-300)] shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => toggleMobileMenu()}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-ivory-200)] transition-colors -ml-2"
              aria-label="Toggle menu"
            >
              <Menu size={24} className="text-[var(--color-brown-900)]" />
            </button>
            <h1 className="font-display text-sm sm:text-base font-bold text-[var(--color-brown-900)]">
              <span className="hidden sm:inline">Shri Ganapathi Mess</span>
              <span className="sm:hidden">SGM</span>
            </h1>
            <span className="hidden sm:inline font-body text-xs text-[var(--color-brown-400)] px-2 py-0.5 rounded-full bg-[var(--color-ivory-200)]">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <NotificationBell />
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-[var(--color-ivory-300)]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-body flex-shrink-0"
                style={{ backgroundColor: 'var(--color-green-800)' }}
              >
                {user.email?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <div className="hidden md:block">
                <p className="font-body text-sm font-medium text-[var(--color-brown-700)] leading-tight">
                  {user.email?.split('@')[0] ?? 'Admin'}
                </p>
                {role && (
                  <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>

        <footer className="px-4 sm:px-6 py-4 border-t border-[var(--color-ivory-300)] bg-white">
          <p className="font-body text-xs text-[var(--color-brown-400)] text-center">
            © {new Date().getFullYear()} Shri Ganapathi Mess · Admin Panel · Internal Use Only
          </p>
        </footer>
      </div>
    </div>
  );
}
