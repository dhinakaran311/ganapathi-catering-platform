-- =============================================================================
-- Migration 021: RBAC-aware RLS Policies
-- Replaces the old "any authenticated = admin" policies with role-aware ones.
-- OWNER + ADMIN = full access (preserves current behaviour for existing user).
-- STAFF = manage enquiries/customers, create invoices, record payments.
-- VIEWER = read-only on all business tables.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENQUIRIES
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop old flat policies
DROP POLICY IF EXISTS "Admin can view all enquiries" ON enquiries;
DROP POLICY IF EXISTS "Admin can update enquiries"   ON enquiries;

-- VIEWER+ can read all enquiries
CREATE POLICY "Staff can view all enquiries"
  ON enquiries FOR SELECT
  USING (has_min_role('VIEWER'));

-- STAFF+ can update enquiries (status, notes, next_action, assigned_to)
CREATE POLICY "Staff can update enquiries"
  ON enquiries FOR UPDATE
  USING (has_min_role('STAFF'));

-- ADMIN+ can insert enquiries manually
CREATE POLICY "Admin can insert enquiries"
  ON enquiries FOR INSERT
  WITH CHECK (has_any_role('OWNER', 'ADMIN'));

-- ─────────────────────────────────────────────────────────────────────────────
-- ENQUIRY STATUS HISTORY
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage status history" ON enquiry_status_history;

CREATE POLICY "Staff can view status history"
  ON enquiry_status_history FOR SELECT
  USING (has_min_role('VIEWER'));

CREATE POLICY "Staff can insert status history"
  ON enquiry_status_history FOR INSERT
  WITH CHECK (has_min_role('STAFF'));

-- Only ADMIN+ can delete history entries (data correction)
CREATE POLICY "Admin can delete status history"
  ON enquiry_status_history FOR DELETE
  USING (has_any_role('OWNER', 'ADMIN'));

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage customers" ON customers;

-- VIEWER+ can read customers
CREATE POLICY "Staff can view customers"
  ON customers FOR SELECT
  USING (has_min_role('VIEWER'));

-- STAFF+ can create/update customers
CREATE POLICY "Staff can manage customers"
  ON customers FOR INSERT
  WITH CHECK (has_min_role('STAFF'));

CREATE POLICY "Staff can update customers"
  ON customers FOR UPDATE
  USING (has_min_role('STAFF'));

-- ADMIN+ can delete customers (soft delete should be preferred)
CREATE POLICY "Admin can delete customers"
  ON customers FOR DELETE
  USING (has_any_role('OWNER', 'ADMIN'));

-- ─────────────────────────────────────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage invoices" ON invoices;

-- VIEWER+ read invoices
CREATE POLICY "Staff can view invoices"
  ON invoices FOR SELECT
  USING (has_min_role('VIEWER'));

-- STAFF+ create invoices
CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (has_min_role('STAFF'));

-- STAFF+ update invoices (STAFF may only update their own in future)
CREATE POLICY "Staff can update invoices"
  ON invoices FOR UPDATE
  USING (has_min_role('STAFF'));

-- Physical deletion already blocked by migration 017's USING(false) policy.
-- That policy is preserved; we only add role-based control above it.

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop old flat policies (from migration 013 inline policy text)
DROP POLICY IF EXISTS "Admin can view payments"   ON payments;
DROP POLICY IF EXISTS "Admin can create payments" ON payments;
DROP POLICY IF EXISTS "Admin can update payments" ON payments;

-- VIEWER+ read
CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT
  USING (has_min_role('VIEWER'));

-- STAFF+ can record new payments
CREATE POLICY "Staff can create payments"
  ON payments FOR INSERT
  WITH CHECK (has_min_role('STAFF'));

-- ADMIN+ can verify/reject payments (higher stakes action)
CREATE POLICY "Admin can update payments"
  ON payments FOR UPDATE
  USING (has_any_role('OWNER', 'ADMIN'));

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_logs;

-- ADMIN+ can view audit logs; STAFF and VIEWER cannot
CREATE POLICY "Admin can view audit logs"
  ON audit_logs FOR SELECT
  USING (has_any_role('OWNER', 'ADMIN'));

-- Service-role insert remains (WITH CHECK (true) from migration 011)

-- ─────────────────────────────────────────────────────────────────────────────
-- HOTELS / MENUS / GALLERY / SERVICE AREAS / REVIEWS / THEME
-- (Content management — ADMIN+ only for writes)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage hotels"       ON hotels;
DROP POLICY IF EXISTS "Admin can manage menus"        ON menus;
DROP POLICY IF EXISTS "Admin can manage menu items"   ON menu_items;
DROP POLICY IF EXISTS "Admin can manage gallery"      ON gallery;
DROP POLICY IF EXISTS "Admin can manage service areas" ON service_areas;
DROP POLICY IF EXISTS "Admin can manage reviews"      ON reviews;
DROP POLICY IF EXISTS "Admin can manage theme"        ON theme_settings;
DROP POLICY IF EXISTS "Admin can manage reminders"    ON booking_reminders;
DROP POLICY IF EXISTS "Admin can manage custom food"  ON custom_food_requests;
DROP POLICY IF EXISTS "Admin can view analytics"      ON analytics_events;

CREATE POLICY "Admin can manage hotels"         ON hotels         FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage menus"          ON menus          FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage menu items"     ON menu_items     FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage gallery"        ON gallery        FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage service areas"  ON service_areas  FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage reviews"        ON reviews        FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage theme"          ON theme_settings FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage reminders"      ON booking_reminders     FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can manage custom food"    ON custom_food_requests  FOR ALL USING (has_any_role('OWNER', 'ADMIN'));
CREATE POLICY "Admin can view analytics"        ON analytics_events FOR SELECT USING (has_any_role('OWNER', 'ADMIN'));

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_policies
  WHERE policyname LIKE 'Staff can%'
     OR policyname LIKE 'Admin can%'
     OR policyname LIKE 'Owner can%';

  RAISE NOTICE '=== Migration 021 Complete ===';
  RAISE NOTICE 'Total role-aware policies: %', v_count;
  RAISE NOTICE 'is_admin() now requires OWNER or ADMIN role';
  RAISE NOTICE 'STAFF/VIEWER roles are now enforced at RLS level';
END $$;
