'use client';

// components/admin/AdminLayoutClient.tsx - Client-side layout wrapper for admin panel
// Handles mobile menu toggle logic

import { Menu } from 'lucide-react';
import AdminSidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AdminLayoutClientProps {
  user: {
    email?: string | null;
  } | null;
  children: React.ReactNode;
}

// Helper function to toggle mobile menu
function toggleMobileMenu() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('toggleMobileMenu'));
  }
}

export default function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Fixed sidebar - mobile responsive */}
      <AdminSidebar />

      {/* Main content — offset by sidebar width on desktop only */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          id="admin-topbar"
          className="sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-[var(--color-ivory-300)] shadow-sm"
        >
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger menu button - Mobile only */}
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

          {/* Right side: Theme toggle + Notifications + User */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <NotificationBell />
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-[var(--color-ivory-300)]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-body"
                style={{ backgroundColor: 'var(--color-green-800)' }}
              >
                {user.email?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <span className="hidden md:block font-body text-sm font-medium text-[var(--color-brown-700)]">
                {user.email?.split('@')[0] ?? 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
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
