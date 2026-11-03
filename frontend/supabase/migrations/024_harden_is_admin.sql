-- =============================================================================
-- Migration 024: Harden is_admin() (defence-in-depth for audit P0 #2)
--
-- Background
-- ----------
-- Migration 011 originally defined:
--     is_admin() -> auth.uid() IS NOT NULL
-- which treated EVERY authenticated Supabase user as an admin. Migration 019
-- replaced it with a role-based check (OWNER/ADMIN only). However, if 019 was
-- never applied to an environment, that vulnerable definition is still live and
-- every signed-in user gets admin-level RLS access.
--
-- This migration re-asserts the SAFE, fail-closed definition so that applying
-- migrations 011..024 in ANY order or subset still ends with a hardened
-- is_admin(). It is idempotent (CREATE OR REPLACE) and safe to re-run.
--
-- Fail-closed behaviour:
--   * No auth.uid()                       -> false (unauthenticated)
--   * staff_profiles table missing         -> false (RBAC not provisioned yet)
--   * No active OWNER/ADMIN row for uid    -> false
-- This guarantees that a half-migrated database DENIES rather than ALLOWS.
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Unauthenticated -> never admin
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If the RBAC table was never created (019 not applied), FAIL CLOSED.
  IF to_regclass('public.staff_profiles') IS NULL THEN
    RAISE WARNING 'is_admin(): staff_profiles table missing — failing closed (deny). Apply migration 019.';
    RETURN FALSE;
  END IF;

  -- Require an active OWNER or ADMIN profile for the current user.
  RETURN EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role IN ('OWNER'::staff_role, 'ADMIN'::staff_role)
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION is_admin() IS
  'TRUE only for an authenticated user with an active OWNER/ADMIN staff profile. Fail-closed: returns FALSE when unauthenticated, when staff_profiles is absent, or when no qualifying profile exists. Hardened in 024 (was unsafe in 011, corrected in 019).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification helper (audit P0 #2 acceptance)
-- ─────────────────────────────────────────────────────────────────────────────
-- Run the following in the Supabase SQL editor AFTER applying migrations.
-- It must report is_admin_safe = TRUE and the legacy open check must be gone.
--
--   SELECT p.email,
--          sp.role,
--          is_admin() AS is_admin_safe
--   FROM auth.users u
--   JOIN auth.identities i ON i.user_id = u.id
--   LEFT JOIN staff_profiles sp ON sp.user_id = u.id
--   LEFT JOIN LATERAL (SELECT u.email) p ON true
--   ORDER BY sp.role NULLS LAST;
--
-- Expected:
--   * The seeded OWNER shows role=OWNER, is_admin_safe=true
--   * Any non-staff authenticated user shows is_admin_safe=false
--   * A signed-out session (anon key) can SELECT no admin rows at all

-- Optional convenience view: non-destructive snapshot of who is currently admin.
-- Useful for the audit-logs screen and for support diagnostics.
DO $$
BEGIN
  IF to_regclass('public.staff_profiles') IS NOT NULL THEN
    CREATE OR REPLACE VIEW admin_user_roles AS
    SELECT
      sp.user_id,
      u.email,
      sp.role,
      sp.is_active,
      sp.full_name,
      sp.updated_at
    FROM staff_profiles sp
    JOIN auth.users u ON u.id = sp.user_id
    ORDER BY sp.is_active DESC, sp.role DESC;

    COMMENT ON VIEW admin_user_roles IS
      'Read-only snapshot of staff roles (email, role, active flag) for admin diagnostics.';

    RAISE NOTICE 'Created admin_user_roles view.';
  ELSE
    RAISE WARNING 'staff_profiles missing — skipped admin_user_roles view. Apply migration 019 first.';
  END IF;
END $$;
