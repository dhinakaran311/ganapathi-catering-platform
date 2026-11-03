// app/admin/settings/team/page.tsx — Role management (OWNER only)

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_DESCRIPTIONS, type StaffRole } from '@/types/staff';
import TeamRoleManager from '@/components/admin/TeamRoleManager';

export default async function TeamPage() {
  const { user, role } = await getCurrentUserWithRole();

  // Only OWNER can access team management
  if (role !== 'OWNER') {
    redirect('/admin/settings');
  }

  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from('staff_profiles')
    .select('id, user_id, role, full_name, is_active, created_at')
    .order('created_at', { ascending: true });

  // Get emails
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  authUsers?.users?.forEach((u) => { emailMap[u.id] = u.email ?? ''; });

  const enriched = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.user_id] ?? null,
  }));

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
          <Shield size={22} className="text-purple-600" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)]">
            Team & Roles
          </h1>
        </div>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Manage who can access the admin panel and what they can do.
        </p>
      </div>

      {/* Role reference card */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6 mb-6">
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-3">Role Permissions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['OWNER', 'ADMIN', 'STAFF', 'VIEWER'] as StaffRole[]).map((r) => (
            <div key={r} className="rounded-lg border border-[var(--color-ivory-300)] p-3">
              <span className={`inline-block px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border mb-2 ${ROLE_BADGE_COLORS[r]}`}>
                {ROLE_LABELS[r]}
              </span>
              <p className="font-body text-xs text-[var(--color-brown-600)]">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team table — client component handles role changes */}
      <TeamRoleManager
        profiles={enriched}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}
