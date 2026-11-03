-- =============================================================================
-- Migration 027: Security hardening (Phase 1)
--
-- Closes holes that were reachable with the PUBLIC anon key (which ships in
-- every browser bundle) via Supabase's auto-generated REST API (/rest/v1):
--
--   1. Views ran with their OWNER's privileges (no security_invoker), so they
--      bypassed RLS. e.g. upcoming_catering_events exposed customer names,
--      phones and balances; audit-trail views exposed the audit log.
--   2. admin_user_roles (public schema) joined auth.users → staff emails.
--   3. SECURITY DEFINER functions with NO caller check were executable by
--      anon (Supabase grants EXECUTE on public functions by default):
--        complete_order(...)            → complete any order, spoof p_user_id
--        cancel_invoice(...)            → cancel any invoice
--        log_audit_event(...)           → forge audit entries
--        log_enquiry_status_change(...) → forge status history
--   4. SECURITY DEFINER functions had no fixed search_path (hijack risk).
--   5. invoice_number_counters had no RLS → anyone could read/reset counters.
--   6. Anon INSERT policies let anyone write straight into enquiries, reviews,
--      analytics_events and audit_logs, bypassing the API's validation, spam
--      protection and rate limiting. The app writes these ONLY through
--      server routes using the service role (which bypasses RLS), so these
--      policies are not needed by any feature.
--
-- Also adds:
--   7. rate_limit_hits + check_rate_limit() — DB-backed rate limiting for the
--      public enquiry / review / analytics endpoints (works on serverless,
--      no Redis needed).
--
-- Idempotent: safe to re-run. Does not touch any data rows.
-- Requires PostgreSQL 15+ (security_invoker). Supabase runs 15+/17.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Views: respect the caller's RLS, and no anon access at all
--    Staff (authenticated) keep SELECT; what they can see is now governed by
--    the RLS policies of the underlying tables (021_rbac_rls_policies.sql).
--    Server code that reads views with the service-role client is unaffected.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v RECORD;
BEGIN
  FOR v IN
    SELECT viewname
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname <> 'admin_user_roles'
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v.viewname);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', v.viewname);
    RAISE NOTICE 'Hardened view: %', v.viewname;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. admin_user_roles → private schema (not exposed by the REST API)
--    Still available in the SQL editor:  SELECT * FROM private.admin_user_roles;
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_user_roles;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.staff_profiles') IS NOT NULL THEN
    CREATE OR REPLACE VIEW private.admin_user_roles AS
    SELECT sp.user_id, u.email, sp.role, sp.is_active, sp.full_name, sp.updated_at
    FROM public.staff_profiles sp
    JOIN auth.users u ON u.id = sp.user_id
    ORDER BY sp.is_active DESC, sp.role DESC;

    REVOKE ALL ON private.admin_user_roles FROM PUBLIC, anon, authenticated;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Lock down privileged functions: service role only
--    The app calls complete_order via the server-side service-role client
--    (app/api/admin/enquiries/[id]/complete), which keeps working. The rest
--    are not called from app code. Trigger functions are unaffected (EXECUTE
--    is checked when the trigger is created, not when it fires).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN (
        'complete_order',
        'cancel_invoice',
        'log_audit_event',
        'log_enquiry_status_change',
        'backfill_customer_relationships',
        'get_next_invoice_number',
        'preview_next_invoice_number'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    RAISE NOTICE 'Restricted to service_role: %', f.sig;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Pin search_path on EVERY SECURITY DEFINER function in public
--    (prevents a malicious object in another schema shadowing a table/func).
--    RLS helpers (is_admin, has_role, has_any_role, has_min_role, get_my_role)
--    keep their EXECUTE grants — RLS policies evaluated for anon need them.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosecdef = true
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.sig);
    RAISE NOTICE 'Pinned search_path: %', f.sig;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. invoice_number_counters: enable RLS (no policies → service role only)
--    Invoices are inserted only by server routes using the service role, so
--    the numbering trigger keeps working.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.invoice_number_counters') IS NOT NULL THEN
    ALTER TABLE public.invoice_number_counters ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.invoice_number_counters FROM anon, authenticated;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Remove anon write paths (all public writes go through server routes)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can submit enquiries"       ON public.enquiries;
DROP POLICY IF EXISTS "Public can submit reviews"         ON public.reviews;
DROP POLICY IF EXISTS "Public can track analytics"        ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
-- (The service role bypasses RLS, so server-side inserts are unaffected.)


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Rate limiting for public endpoints
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id      BIGSERIAL PRIMARY KEY,
  bucket  TEXT        NOT NULL,          -- e.g. 'enquiry:ip:<sha256>'
  hit_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_bucket_time
  ON public.rate_limit_hits (bucket, hit_at);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;  -- no policies
REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;

COMMENT ON TABLE public.rate_limit_hits IS
  'Sliding-window rate-limit log for public API routes. Buckets hold hashed IPs/phones only. Service role only.';

-- Returns TRUE if the request is allowed (and records it), FALSE if the
-- bucket already has p_limit hits inside the window.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket          TEXT,
  p_limit           INTEGER,
  p_window_seconds  INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Serialise concurrent requests for the same bucket.
  PERFORM pg_advisory_xact_lock(hashtext(p_bucket));

  DELETE FROM rate_limit_hits
  WHERE bucket = p_bucket
    AND hit_at < now() - make_interval(secs => p_window_seconds);

  SELECT count(*) INTO v_count
  FROM rate_limit_hits
  WHERE bucket = p_bucket;

  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  INSERT INTO rate_limit_hits (bucket) VALUES (p_bucket);

  -- Occasional global cleanup so the table never grows unbounded.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_hits WHERE hit_at < now() - INTERVAL '1 day';
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;


-- =============================================================================
-- VERIFY (run in the SQL editor after applying) — every row should be FALSE:
--
--   SELECT 'anon can read upcoming_catering_events' AS check,
--          has_table_privilege('anon', 'public.upcoming_catering_events', 'SELECT') AS result
--   UNION ALL SELECT 'anon can read invoice_payment_summary',
--          has_table_privilege('anon', 'public.invoice_payment_summary', 'SELECT')
--   UNION ALL SELECT 'anon can run complete_order',
--          bool_or(has_function_privilege('anon', p.oid, 'EXECUTE'))
--          FROM pg_proc p WHERE p.proname = 'complete_order'
--   UNION ALL SELECT 'anon can run cancel_invoice',
--          bool_or(has_function_privilege('anon', p.oid, 'EXECUTE'))
--          FROM pg_proc p WHERE p.proname = 'cancel_invoice'
--   UNION ALL SELECT 'admin_user_roles still public',
--          to_regclass('public.admin_user_roles') IS NOT NULL;
--
-- ALSO (dashboard, not SQL): Authentication → Sign In / Providers →
--   turn OFF "Allow new users to sign up". Staff accounts are then created
--   only via Authentication → Users → "Add user" by the owner.
-- =============================================================================
