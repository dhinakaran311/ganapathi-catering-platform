// components/admin/TeamRoleManager.tsx — Client component for role management table
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, UserCheck, UserX } from 'lucide-react';
import { ROLE_LABELS, ROLE_BADGE_COLORS, STAFF_ROLES, type StaffRole } from '@/types/staff';

interface Profile {
  id: string;
  user_id: string;
  role: StaffRole;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  email: string | null;
}

interface TeamRoleManagerProps {
  profiles: Profile[];
  currentUserId: string;
}

export default function TeamRoleManager({ profiles, currentUserId }: TeamRoleManagerProps) {
  const router = useRouter();
  const [saving, setSaving]   = useState<string | null>(null); // profile_id being saved
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleChange = async (profileId: string, newRole: StaffRole) => {
    setSaving(profileId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to update role'); return; }
      setSuccess(`Role updated to ${ROLE_LABELS[newRole]}`);
      setTimeout(() => setSuccess(''), 3000);
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (profileId: string, isActive: boolean) => {
    setSaving(profileId);
    setError('');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, is_active: !isActive }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to update status'); return; }
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[var(--color-ivory-300)]">
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
          Staff Members ({profiles.length})
        </h2>
        {success && (
          <span className="inline-flex items-center gap-1 font-body text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <Check size={12} /> {success}
          </span>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 font-body text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-ivory-100)]">
            <tr>
              {['Name / Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-ivory-200)]">
            {profiles.map((p) => {
              const isCurrentUser = p.user_id === currentUserId;
              const isSaving = saving === p.id;
              return (
                <tr key={p.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {p.full_name ?? p.email ?? 'Unknown'}
                      {isCurrentUser && (
                        <span className="ml-2 font-body text-[10px] text-[var(--color-brown-400)]">(you)</span>
                      )}
                    </p>
                    {p.full_name && p.email && (
                      <p className="font-body text-xs text-[var(--color-brown-400)]">{p.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isCurrentUser ? (
                      // Can't change own role
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border ${ROLE_BADGE_COLORS[p.role as StaffRole]}`}>
                        {ROLE_LABELS[p.role as StaffRole]}
                      </span>
                    ) : (
                      <select
                        value={p.role}
                        disabled={isSaving}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as StaffRole)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-xs font-semibold text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] disabled:opacity-50"
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-body text-xs font-semibold px-2 py-0.5 rounded-full border ${p.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)]">
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-colors disabled:opacity-50 min-h-[36px] ${
                          p.is_active
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                        aria-label={p.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {p.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                        {isSaving ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-[var(--color-ivory-200)]">
        {profiles.map((p) => {
          const isCurrentUser = p.user_id === currentUserId;
          const isSaving = saving === p.id;
          return (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] truncate">
                    {p.full_name ?? p.email ?? 'Unknown'}
                    {isCurrentUser && <span className="ml-1 text-[10px] text-[var(--color-brown-400)]">(you)</span>}
                  </p>
                  {p.full_name && p.email && (
                    <p className="font-body text-xs text-[var(--color-brown-400)] truncate">{p.email}</p>
                  )}
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full font-body text-xs font-semibold border flex-shrink-0 ${ROLE_BADGE_COLORS[p.role as StaffRole]}`}>
                  {ROLE_LABELS[p.role as StaffRole]}
                </span>
              </div>

              {!isCurrentUser && (
                <div className="flex gap-2">
                  <select
                    value={p.role}
                    disabled={isSaving}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as StaffRole)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-xs text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] disabled:opacity-50 min-h-[40px]"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleToggleActive(p.id, p.is_active)}
                    disabled={isSaving}
                    className={`px-3 py-2 rounded-lg font-body text-xs font-semibold border transition-colors disabled:opacity-50 min-h-[40px] ${
                      p.is_active
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
