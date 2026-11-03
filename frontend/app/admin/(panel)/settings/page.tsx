// app/admin/settings/page.tsx — A4: Admin settings page stub

import Link from 'next/link';
import { Palette, User, Bell, Shield } from 'lucide-react';
import { getCurrentUserWithRole } from '@/lib/auth/roles';

const sections = [
  {
    href: '/admin/settings/profile',
    icon: <User size={20} />,
    title: 'Profile & Security',
    desc: 'Change your email, password, and enable two-factor authentication (2FA).',
    accent: 'green',
    ownerOnly: false,
  },
  {
    href: '/admin/settings/theme',
    icon: <Palette size={20} />,
    title: 'Theme & Branding',
    desc: 'Customise colours, logos, and hero text displayed on the public website.',
    accent: 'gold',
    ownerOnly: false,
  },
  {
    href: '/admin/settings/notifications',
    icon: <Bell size={20} />,
    title: 'Notifications',
    desc: 'Configure WhatsApp and notification preferences for new enquiries.',
    accent: 'brown',
    ownerOnly: false,
  },
  {
    href: '/admin/settings/team',
    icon: <Shield size={20} />,
    title: 'Team & Roles',
    desc: 'Manage staff access levels: Owner, Admin, Staff, and Viewer.',
    accent: 'purple',
    ownerOnly: true,
  },
];

export default async function SettingsPage() {
  const { role } = await getCurrentUserWithRole();
  const visibleSections = sections.filter((s) => !s.ownerOnly || role === 'OWNER');
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Settings
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Manage your account, branding, and notification preferences
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSections.map(({ href, icon, title, desc, accent }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6 hover:shadow-md hover:-translate-y-px transition-all duration-200"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                accent === 'green'
                  ? 'bg-[var(--color-green-100)] text-[var(--color-green-700)]'
                  : accent === 'gold'
                  ? 'bg-[var(--color-gold-100)] text-[var(--color-gold-700)]'
                  : accent === 'purple'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-[var(--color-ivory-300)] text-[var(--color-brown-700)]'
              }`}
            >
              {icon}
            </div>
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-1 group-hover:text-[var(--color-green-800)] transition-colors">
              {title}
            </h2>
            <p className="font-body text-sm text-[var(--color-brown-500)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
