'use client';

// app/admin/(auth)/login/page.tsx — H58: Admin login page
// Step 1: Supabase email/password sign-in.
// Step 2 (only for users who enrolled 2FA): 6-digit authenticator code, which
//         raises the session to aal2. proxy.ts / the admin layout / every admin
//         API refuse access until this step is done.
// Design: centered card on ivory bg, matches brand tokens

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChefHat, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

type Step = 'credentials' | 'mfa';

/** Where to go after login. Only same-site /admin paths are honoured, so the
 *  ?redirect= parameter can't be abused as an open redirect. */
function postLoginTarget(): string {
  const requested = new URLSearchParams(window.location.search).get('redirect');
  return requested && requested.startsWith('/admin/') && !requested.startsWith('/admin/login')
    ? requested
    : '/admin/dashboard';
}

/** Returns the verified TOTP factor id if this session still needs the 2FA step. */
async function pendingTotpFactor(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') return null;
  const { data: factors } = await supabase.auth.mfa.listFactors();
  return factors?.totp?.find((f) => f.status === 'verified')?.id ?? null;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Arriving with ?mfa=1 means the password step is already done (e.g. the
  // user refreshed, or opened an admin link) — go straight to the code step.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mfa') !== '1') return;
    const supabase = createClient();
    pendingTotpFactor(supabase).then((id) => {
      if (id) {
        setFactorId(id);
        setStep('mfa');
      }
    });
  }, []);

  const finish = () => {
    router.push(postLoginTarget());
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    const pending = await pendingTotpFactor(supabase);
    if (pending) {
      setFactorId(pending);
      setStep('mfa');
      setLoading(false);
      return;
    }

    finish();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setError('That code didn’t work. Check your authenticator app and try again.');
      setCode('');
      setLoading(false);
      return;
    }

    finish();
  };

  const handleSwitchAccount = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setStep('credentials');
    setFactorId(null);
    setCode('');
    setPassword('');
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-ivory-200)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ backgroundColor: 'var(--color-green-900)' }}
          >
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-brown-900)] mb-1">
            Shri Ganapathi Mess
          </h1>
          <p className="font-body text-sm text-[var(--color-brown-500)]">Admin Portal</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[var(--color-ivory-300)] p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-brown-900)] mb-6 text-center">
            {step === 'mfa' ? 'Two-Factor Verification' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <p className="font-body text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'mfa' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-green-50)] border border-[var(--color-ivory-300)]">
                <ShieldCheck size={18} className="text-[var(--color-green-700)] flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-[var(--color-brown-700)]">
                  Open your authenticator app and enter the 6-digit code for Shri Ganapathi Mess.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-otp"
                  className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2"
                >
                  Authentication code
                </label>
                <input
                  id="admin-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-mono text-2xl tracking-[0.5em] text-center text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-300)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full h-12 rounded-lg font-body text-base font-semibold text-white transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: 'var(--color-green-800)' }}
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] transition-colors"
              >
                Use a different account
              </button>
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brown-400)]">
                  <Mail size={16} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-300)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block font-body text-sm font-semibold text-[var(--color-brown-800)] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brown-400)]">
                  <Lock size={16} />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-base text-[var(--color-brown-900)] placeholder:text-[var(--color-brown-300)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brown-400)] hover:text-[var(--color-brown-700)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-body text-base font-semibold text-white transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: 'var(--color-green-800)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          )}

          <p className="mt-6 text-center font-body text-xs text-[var(--color-brown-400)]">
            This portal is for authorised hotel staff only.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/en"
            className="font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] transition-colors"
          >
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
