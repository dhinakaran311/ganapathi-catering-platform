// lib/auth/mfa.ts — Two-factor (TOTP) enforcement helper.
//
// A user who has enrolled a VERIFIED authenticator factor must complete the
// TOTP challenge (session assurance level "aal2") before reaching any admin
// page or admin API. Users without 2FA enrolled are unaffected.
//
// Call this only AFTER supabase.auth.getUser() has succeeded — getUser()
// verifies the access token with Supabase Auth, and the assurance level is
// then read from that same verified token.

import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface MfaStatus {
  /** User has at least one verified 2FA factor. */
  required: boolean;
  /** Current session has completed the 2FA challenge (or 2FA not required). */
  satisfied: boolean;
}

export async function getMfaStatus(supabase: SupabaseClient, user: User): Promise<MfaStatus> {
  const required = (user.factors ?? []).some((f) => f.status === 'verified');
  if (!required) return { required: false, satisfied: true };

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return { required: true, satisfied: false };
  return { required: true, satisfied: data.currentLevel === 'aal2' };
}
