// lib/security/turnstile.ts — Cloudflare Turnstile server-side verification.
//
// OPTIONAL: only enforced when TURNSTILE_SECRET_KEY is set. Without it the
// check is skipped, so the site keeps working until keys are configured
// (honeypot + rate limiting still apply).
//
// Setup: Cloudflare dashboard → Turnstile → add site → copy the keys into
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY (browser) and TURNSTILE_SECRET_KEY (server).

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → not enforced
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    // Cloudflare unreachable: fail open rather than lose a real enquiry.
    console.warn('[turnstile] verification unavailable, allowing request:', err instanceof Error ? err.message : err);
    return true;
  }
}
