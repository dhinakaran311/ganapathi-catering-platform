'use client';

// components/admin/Sidebar.tsx — E36: Admin sidebar navigation
// Design: Deep green (#0D2611) background, gold accent, Playfair Display headings
// Matches existing brand tokens from globals.css

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
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/enquiries',  label: 'Enquiries',  icon: ClipboardList },
  { href: '/admin/invoices',   label: 'Invoices',   icon: Receipt },
  { href: '/admin/customers',  label: 'Customers',  icon: Users },
  { href: '/admin/reports',    label: 'Analytics',  icon: BarChart3 },
  { href: '/admin/reviews',    label: 'Reviews',    icon: Star },
  { href: '/admin/settings',   label: 'Settings',   icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"
      style={{ backgroundColor: 'var(--color-green-900)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
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
  );
}
