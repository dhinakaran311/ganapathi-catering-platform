// components/admin/ChangePasswordForm.tsx — H58: Change password via Supabase Auth.
// Uses the browser client with the signed-in session. Requires the current
// password for safety.

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)]';

export default function ChangePasswordForm() {
  const supabase = createClient();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (next.length < 8) {
      setMsg({ ok: false, text: 'New password must be at least 8 characters.' });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }

    setBusy(true);
    try {
      // Supabase requires a fresh sign-in to update the password. Verify the
      // current password first, then update.
      const { data: user } = await supabase.auth.getUser();
      const email = user.user?.email;
      if (!email) throw new Error('Not signed in');

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInErr) throw new Error('Current password is incorrect.');

      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;

      setMsg({ ok: true, text: 'Password updated. You have been signed out — please sign in again.' });
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
      }, 2000);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not update password' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">
          Current password
        </label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} autoComplete="current-password" required />
      </div>
      <div>
        <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">
          New password
        </label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} autoComplete="new-password" required />
      </div>
      <div>
        <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">
          Confirm new password
        </label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" required />
      </div>

      {msg && (
        <p className={`font-body text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="alert">
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 h-10 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
