// lib/auth/roles.ts — Server-side role helpers
// These run only in Server Components and API routes (never in the browser).
// They always fetch the role from the DB — never from the client.

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { StaffRole } from '@/types/staff';
import { getMfaStatus } from '@/lib/auth/mfa';

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current user and their role from the DB.
 * Returns null for both if not authenticated or no profile.
 *
 * A user who has 2FA enrolled but has NOT completed the TOTP challenge in this
 * session is treated as unauthenticated (null), so every requireMinRole /
 * requireAnyRole API guard also enforces 2FA.
 */
export async function getCurrentUserWithRole(): Promise<{
  user: { id: string; email: string | undefined } | null;
  role: StaffRole | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const mfa = await getMfaStatus(supabase, user);
  if (!mfa.satisfied) return { user: null, role: null };

  // Fetch role from DB — never trust client-provided role
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('staff_profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  return {
    user: { id: user.id, email: user.email },
    role: (profile?.role as StaffRole) ?? null,
  };
}

/**
 * Returns just the current user's role. Returns null if unauthenticated.
 */
export async function getCurrentUserRole(): Promise<StaffRole | null> {
  const { role } = await getCurrentUserWithRole();
  return role;
}

/**
 * Role hierarchy: OWNER(4) > ADMIN(3) > STAFF(2) > VIEWER(1)
 */
const ROLE_RANK: Record<StaffRole, number> = {
  OWNER:  4,
  ADMIN:  3,
  STAFF:  2,
  VIEWER: 1,
};

/**
 * True if the user's role is at least the minimum required.
 */
export function hasMinRole(userRole: StaffRole | null, minRole: StaffRole): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

/**
 * True if the user has exactly one of the listed roles.
 */
export function hasAnyRole(userRole: StaffRole | null, ...roles: StaffRole[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

// ─────────────────────────────────────────────────────────────────────────────
// API route guard helpers
// Use these in route handlers to enforce RBAC at the API layer.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enforces authentication + minimum role for an API route.
 * Returns { user, role } on success, or a 401/403 NextResponse on failure.
 *
 * Usage in a route handler:
 *   const authResult = await requireMinRole('STAFF');
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user, role } = authResult;
 */
export async function requireMinRole(minRole: StaffRole): Promise<
  { user: { id: string; email: string | undefined }; role: StaffRole } | NextResponse
> {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasMinRole(role, minRole)) {
    return NextResponse.json(
      { error: `Forbidden: requires ${minRole} role or higher` },
      { status: 403 }
    );
  }

  return { user, role: role! };
}

/**
 * Enforces that the user has one of the listed roles (non-hierarchical).
 */
export async function requireAnyRole(...roles: StaffRole[]): Promise<
  { user: { id: string; email: string | undefined }; role: StaffRole } | NextResponse
> {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasAnyRole(role, ...roles)) {
    return NextResponse.json(
      { error: `Forbidden: requires one of ${roles.join(', ')}` },
      { status: 403 }
    );
  }

  return { user, role: role! };
}
