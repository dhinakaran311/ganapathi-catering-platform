// app/admin/settings/profile/page.tsx — H58: Profile & security settings
// Lets the signed-in user change their password and enable TOTP 2FA.
// Any authenticated staff member can access their own profile.

import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, KeyRound } from 'lucide-react';
import TwoFactorSetup from '@/components/admin/TwoFactorSetup';
import ChangePasswordForm from '@/components/admin/ChangePasswordForm';

export default async function ProfileSettingsPage() {
  const { user } = await getCurrentUserWithRole();
  if (!user) redirect('/admin/login');

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
          <User size={22} className="text-[var(--color-green-700)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)]">
            Profile & Security
          </h1>
        </div>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Signed in as <span className="font-semibold text-[var(--color-brown-800)]">{user.email}</span>
        </p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Change password */}
        <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={20} className="text-[var(--color-gold-600)]" />
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">Change Password</h2>
          </div>
          <ChangePasswordForm />
        </div>

        {/* 2FA */}
        <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
          <TwoFactorSetup initiallyActive={false} />
        </div>
      </div>
    </div>
  );
}
