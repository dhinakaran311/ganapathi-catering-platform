'use client';

// components/admin/Sidebar.tsx — E36: Admin sidebar navigation (Mobile Responsive)
// Design: Deep green (#0D2611) background, gold accent, Playfair Display headings
// Matches existing brand tokens from globals.css
// Mobile: Slide-in sidebar with backdrop overlay

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Star,
  Settings,
  LogOut,
  ChefHat,
  Bell,
  Receipt,
  X,
  Shield,
  CreditCard,
  CalendarDays,
} from 'lucide-react';
import type { StaffRole } from '@/types/staff';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  minRole?: StaffRole;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/enquiries',  label: 'Enquiries',  icon: ClipboardList },
  { href: '/admin/invoices',   label: 'Invoices',   icon: Receipt },
  { href: '/admin/payments',   label: 'Payments',   icon: CreditCard },
  { href: '/admin/events',     label: 'Events',     icon: CalendarDays },
  { href: '/admin/customers',  label: 'Customers',  icon: Users },
  { href: '/admin/reports',    label: 'Analytics',  icon: BarChart3 },
  { href: '/admin/reviews',    label: 'Reviews',    icon: Star },
  { href: '/admin/settings',   label: 'Settings',   icon: Settings },
];

const ROLE_RANK: Record<StaffRole, number> = { OWNER: 4, ADMIN: 3, STAFF: 2, VIEWER: 1 };

function canSee(role: StaffRole | null, minRole?: StaffRole) {
  if (!minRole) return true;
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

interface AdminSidebarProps {
  role?: StaffRole | null;
}

// Custom event for mobile menu control
const MOBILE_MENU_EVENT = 'toggleMobileMenu';

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for mobile menu toggle events
  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen((prev) => !prev);
    window.addEventListener(MOBILE_MENU_EVENT, handleToggle);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, handleToggle);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Backdrop overlay - Mobile only */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--color-green-900)' }}
      >
      {/* Logo + Close button (mobile) */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-gold-600)' }}
          >
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white leading-tight">Shri Ganapathi</p>
            <p className="font-body text-xs text-white/50 leading-tight">Admin Panel</p>
          </div>
        </div>

        {/* Close button - Mobile only */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} className="text-white/70" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.filter((item) => canSee(role ?? null, item.minRole)).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'text-white bg-white/10 border-l-2 pl-[10px]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                  style={isActive ? { borderLeftColor: 'var(--color-gold-500)' } : {}}
                >
                  <Icon size={18} className={isActive ? 'text-[var(--color-gold-500)]' : ''} />
                  {label}
                </Link>
              </li>
            );
          })}
          {/* Team link — OWNER only */}
          {role === 'OWNER' && (
            <li>
              <Link
                href="/admin/settings/team"
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-150
                  ${pathname.startsWith('/admin/settings/team')
                    ? 'text-white bg-white/10 border-l-2 pl-[10px]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
                style={pathname.startsWith('/admin/settings/team') ? { borderLeftColor: 'var(--color-gold-500)' } : {}}
              >
                <Shield size={18} className={pathname.startsWith('/admin/settings/team') ? 'text-[var(--color-gold-500)]' : ''} />
                Team & Roles
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Hotel info chip */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Bell size={15} className="text-white/40" />
          <span className="font-body text-xs text-white/40">+91 99423 51280</span>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
