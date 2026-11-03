// lib/security/rate-limit.ts — DB-backed sliding-window rate limiter.
//
// Uses public.check_rate_limit() from migration 027 via the service-role
// client, so it works on serverless (no shared memory / Redis needed).
//
// FAIL-OPEN by design: if the function is missing (migration not applied yet)
// or the DB is unreachable, the request is allowed. A broken limiter must
// never stop a real customer from sending an enquiry.

import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitRule {
  /** Bucket key, e.g. `enquiry:ip:<hash>`. Never put raw personal data here. */
  bucket: string;
  limit: number;
  windowSeconds: number;
}

/** Returns true if ALL rules allow the request. */
export async function checkRateLimits(rules: RateLimitRule[]): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    for (const rule of rules) {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_bucket: rule.bucket,
        p_limit: rule.limit,
        p_window_seconds: rule.windowSeconds,
      });
      if (error) {
        console.warn('[rate-limit] check failed, allowing request:', error.message);
        return true;
      }
      if (data === false) return false;
    }
    return true;
  } catch (err) {
    console.warn('[rate-limit] unavailable, allowing request:', err instanceof Error ? err.message : err);
    return true;
  }
}
