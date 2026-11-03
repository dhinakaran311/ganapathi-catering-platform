// app/admin/settings/notifications/page.tsx — E35: Notification preferences
// Preferences are per-browser (localStorage). Any staff member can set them.

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import NotificationSettingsForm from '@/components/admin/NotificationSettingsForm';

export default function NotificationSettingsPage() {
  return (
    <div>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={22} className="text-[var(--color-brown-600)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)]">
            Notifications
          </h1>
        </div>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Choose how you are alerted when a new enquiry arrives.
        </p>
      </div>

      <div className="max-w-lg">
        <NotificationSettingsForm />
      </div>
    </div>
  );
}
