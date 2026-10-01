-- =============================================================================
-- Migration 019: Staff Profiles & RBAC
-- Creates staff_profiles table, role enum, and authorization functions.
-- The single existing user (dhinakaranms123@gmail.com) is automatically
-- seeded as OWNER so no one is locked out.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Role enum
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE staff_role AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'VIEWER');
    RAISE NOTICE 'Created staff_role enum';
  ELSE
    RAISE NOTICE 'staff_role enum already exists';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: staff_profiles table
-- FK to auth.users — one row per admin/staff user
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       staff_role NOT NULL DEFAULT 'STAFF',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_profiles_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE staff_profiles IS
  'One row per admin-panel user. role determines what they can do.';
COMMENT ON COLUMN staff_profiles.role IS
  'OWNER > ADMIN > STAFF > VIEWER. Only OWNER can manage roles.';

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role    ON staff_profiles(role);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Seed the OWNER
-- Every existing auth.users row that has no profile gets OWNER initially.
-- In practice there is exactly one user right now.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO staff_profiles (user_id, role, full_name)
SELECT
  u.id,
  'OWNER'::staff_role,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM staff_profiles sp WHERE sp.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM staff_profiles WHERE role = 'OWNER';
  RAISE NOTICE 'OWNER profiles seeded: %', v_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Core authorization functions
-- All functions are SECURITY DEFINER so they can query staff_profiles.
-- They never accept a role from the client — role comes from DB only.
-- ─────────────────────────────────────────────────────────────────────────────

-- get_my_role() — returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS staff_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE v_role staff_role;
BEGIN
  SELECT role INTO v_role
  FROM staff_profiles
  WHERE user_id = auth.uid()
    AND is_active = true;

  RETURN v_role; -- NULL if user has no profile or is inactive
END;
$$;

COMMENT ON FUNCTION get_my_role IS
  'Returns the staff_role of auth.uid(). Returns NULL if not a staff member.';

-- has_role(required) — exact role match
CREATE OR REPLACE FUNCTION has_role(required_role staff_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role = required_role
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION has_role IS
  'True if auth.uid() has exactly the given role.';

-- has_any_role(variadic) — true if user has any one of the listed roles
CREATE OR REPLACE FUNCTION has_any_role(VARIADIC roles staff_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role = ANY(roles)
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION has_any_role IS
  'True if auth.uid() has any of the given roles. Usage: has_any_role(''OWNER'', ''ADMIN'')';

-- has_min_role(minimum) — hierarchical check: OWNER > ADMIN > STAFF > VIEWER
CREATE OR REPLACE FUNCTION has_min_role(min_role staff_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role staff_role;
  role_order INT;
  min_order  INT;
BEGIN
  SELECT role INTO v_role
  FROM staff_profiles
  WHERE user_id = auth.uid()
    AND is_active = true;

  IF v_role IS NULL THEN RETURN false; END IF;

  -- Map roles to numeric rank (higher = more privilege)
  role_order := CASE v_role
    WHEN 'OWNER'  THEN 4
    WHEN 'ADMIN'  THEN 3
    WHEN 'STAFF'  THEN 2
    WHEN 'VIEWER' THEN 1
    ELSE 0
  END;

  min_order := CASE min_role
    WHEN 'OWNER'  THEN 4
    WHEN 'ADMIN'  THEN 3
    WHEN 'STAFF'  THEN 2
    WHEN 'VIEWER' THEN 1
    ELSE 0
  END;

  RETURN role_order >= min_order;
END;
$$;

COMMENT ON FUNCTION has_min_role IS
  'True if auth.uid() has at least the given role (hierarchical). OWNER passes all checks.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Update is_admin() to use role-based check
-- OWNER + ADMIN are considered "admin" for backward-compat policy expressions.
-- STAFF and VIEWER are NOT admin.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- OWNER or ADMIN only — not STAFF or VIEWER
  RETURN has_any_role('OWNER', 'ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS
  'True for OWNER and ADMIN roles. Used by legacy RLS policies. STAFF and VIEWER return false.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: RLS on staff_profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read staff profiles (needed for assigned_to dropdowns)
CREATE POLICY "Staff can view all profiles"
  ON staff_profiles FOR SELECT
  USING (has_min_role('VIEWER'));

-- Only OWNER can insert new profiles
CREATE POLICY "Owner can add staff"
  ON staff_profiles FOR INSERT
  WITH CHECK (has_role('OWNER'));

-- Only OWNER can update roles; staff can update their own name
CREATE POLICY "Owner can update any profile"
  ON staff_profiles FOR UPDATE
  USING (has_role('OWNER'));

-- Only OWNER can deactivate/delete staff
CREATE POLICY "Owner can delete profiles"
  ON staff_profiles FOR DELETE
  USING (has_role('OWNER'));

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_owner_count  INT;
  v_total_staff  INT;
BEGIN
  SELECT COUNT(*) INTO v_owner_count FROM staff_profiles WHERE role = 'OWNER';
  SELECT COUNT(*) INTO v_total_staff  FROM staff_profiles;

  RAISE NOTICE '=== Migration 019 Complete ===';
  RAISE NOTICE 'staff_profiles total: %', v_total_staff;
  RAISE NOTICE 'OWNER count: %', v_owner_count;
  RAISE NOTICE 'Functions: get_my_role(), has_role(), has_any_role(), has_min_role()';
  RAISE NOTICE 'is_admin() updated: OWNER + ADMIN only';

  IF v_owner_count = 0 THEN
    RAISE WARNING 'No OWNER exists! Manually INSERT into staff_profiles.';
  END IF;
END $$;
