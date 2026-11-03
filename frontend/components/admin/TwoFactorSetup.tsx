// components/admin/TwoFactorSetup.tsx — H58: TOTP two-factor enrolment.
// Uses Supabase Auth MFA (enroll → user scans QR → verify with a 6-digit code).
// All calls go through the browser Supabase client with the signed-in session.

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';

type Step = 'idle' | 'enrolled' | 'verified';

export default function TwoFactorSetup({ initiallyActive }: { initiallyActive: boolean }) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>(initiallyActive ? 'verified' : 'idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startEnrol = async () => {
    setBusy(true);
    setError('');
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (enrollErr) throw enrollErr;
      setFactorId(data.id);
      // Supabase returns an SVG QR code; fall back to showing the raw secret.
      setQrCode(data.totp?.qr_code ?? null);
      setSecret(data.totp?.secret ?? null);
      setStep('enrolled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start 2FA setup');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError('');
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyErr) throw verifyErr;
      setStep('verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code — please try again');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'verified') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
        <ShieldCheck size={20} className="text-green-700" />
        <div>
          <p className="font-body text-sm font-semibold text-green-800">Two-factor is ON</p>
          <p className="font-body text-xs text-green-700">Your account is protected with an authenticator app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--color-ivory-100)] border border-[var(--color-ivory-300)]">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-[var(--color-gold-600)]" />
        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">Two-factor authentication</p>
      </div>

      {step === 'idle' && (
        <>
          <p className="font-body text-xs text-[var(--color-brown-600)] mb-3">
            Add a time-based one-time code (TOTP) from an app like Google Authenticator.
          </p>
          <button
            onClick={startEnrol}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
            {busy ? 'Preparing…' : 'Enable 2FA'}
          </button>
        </>
      )}

      {step === 'enrolled' && (
        <form onSubmit={verify}>
          <p className="font-body text-xs text-[var(--color-brown-600)] mb-3">
            Scan this QR code with your authenticator app, then enter the 6-digit code.
          </p>
          {qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="2FA QR code" className="w-40 h-40 mb-3 rounded bg-white p-2" />
          ) : secret ? (
            <p className="font-body text-xs mb-3">
              Enter this secret manually: <code className="font-mono font-bold">{secret}</code>
            </p>
          ) : null}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-40 px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-mono text-base text-center mb-3"
            aria-label="6-digit authentication code"
          />
          <div>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              {busy ? 'Verifying…' : 'Verify & enable'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="font-body text-xs text-red-600 mt-3" role="alert">{error}</p>
      )}
    </div>
  );
}
