-- =============================================================================
-- verify_migrations_019_to_028.sql: READ-ONLY health check
--
-- Paste the whole file into Supabase → SQL Editor → Run.
-- It is ONE query, so the editor shows every result in one table.
-- Nothing is changed. Safe to run before AND after applying migrations.
--
-- Read the "ok" column:
--   ✅  as expected
--   ❌  not applied / needs action (see "how to fix")
--   ℹ️  information only
-- Only catalog lookups and plain selects are used, so it does not error even
-- when a migration (and its functions) has not been applied yet.
-- =============================================================================

WITH
cust AS (
  SELECT id,
         phone,
         CASE WHEN length(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')) > 10
              THEN right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10)
              ELSE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
         END AS canon,
         total_orders
  FROM public.customers
),
checks (n, migration, check_name, actual, expected, ok, how_to_fix) AS (

  -- ── 019 / 024: is_admin() is role-based (not "any logged-in user") ────────
  SELECT 1, '019/024', 'staff_profiles table exists',
         (to_regclass('public.staff_profiles') IS NOT NULL)::text, 'true',
         to_regclass('public.staff_profiles') IS NOT NULL,
         'Run 019_staff_profiles_rbac.sql, then 024_harden_is_admin.sql'
  UNION ALL
  SELECT 2, '019/024', 'is_admin() is role-based (019/024 version, not "any logged-in user")',
         coalesce((SELECT bool_or(pg_get_functiondef(p.oid) ILIKE '%staff_profiles%' OR pg_get_functiondef(p.oid) ILIKE '%has_any_role%')
                   FROM pg_proc p
                   WHERE p.proname = 'is_admin' AND p.pronamespace = 'public'::regnamespace), false)::text,
         'true',
         coalesce((SELECT bool_or(pg_get_functiondef(p.oid) ILIKE '%staff_profiles%' OR pg_get_functiondef(p.oid) ILIKE '%has_any_role%')
                   FROM pg_proc p
                   WHERE p.proname = 'is_admin' AND p.pronamespace = 'public'::regnamespace), false),
         'Run 024_harden_is_admin.sql'

  -- ── 027: security hardening ───────────────────────────────────────────────
  UNION ALL
  SELECT 10, '027', 'rate_limit_hits table exists',
         (to_regclass('public.rate_limit_hits') IS NOT NULL)::text, 'true',
         to_regclass('public.rate_limit_hits') IS NOT NULL,
         'Run 027_security_hardening.sql'
  UNION ALL
  SELECT 11, '027', 'check_rate_limit() function exists',
         (to_regprocedure('public.check_rate_limit(text,integer,integer)') IS NOT NULL)::text, 'true',
         to_regprocedure('public.check_rate_limit(text,integer,integer)') IS NOT NULL,
         'Run 027_security_hardening.sql'
  UNION ALL
  SELECT 12, '027', 'public.admin_user_roles view removed (leaked staff emails)',
         (to_regclass('public.admin_user_roles') IS NULL)::text, 'true',
         to_regclass('public.admin_user_roles') IS NULL,
         'Run 027_security_hardening.sql'
  UNION ALL
  SELECT 13, '027', 'public views WITHOUT security_invoker (bypass RLS)',
         (SELECT count(*) FROM pg_class c
          WHERE c.relkind = 'v' AND c.relnamespace = 'public'::regnamespace
            AND NOT coalesce(c.reloptions::text[] && ARRAY['security_invoker=true','security_invoker=on'], false))::text,
         '0',
         (SELECT count(*) FROM pg_class c
          WHERE c.relkind = 'v' AND c.relnamespace = 'public'::regnamespace
            AND NOT coalesce(c.reloptions::text[] && ARRAY['security_invoker=true','security_invoker=on'], false)) = 0,
         'Run 027_security_hardening.sql (re-run it after adding any new view)'
  UNION ALL
  SELECT 14, '027', 'old anon INSERT policies still present',
         (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public'
            AND policyname IN ('Public can submit enquiries', 'Public can submit reviews',
                               'Public can track analytics', 'Service role can insert audit logs'))::text,
         '0',
         (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public'
            AND policyname IN ('Public can submit enquiries', 'Public can submit reviews',
                               'Public can track analytics', 'Service role can insert audit logs')) = 0,
         'Run 027_security_hardening.sql'
  UNION ALL
  SELECT 15, '027', 'dangerous functions callable by anon (complete_order, cancel_invoice, ...)',
         (SELECT count(*) FROM pg_proc p
          WHERE p.pronamespace = 'public'::regnamespace
            AND p.proname IN ('complete_order', 'cancel_invoice', 'log_audit_event',
                              'log_enquiry_status_change', 'backfill_customer_relationships',
                              'get_next_invoice_number', 'preview_next_invoice_number')
            AND has_function_privilege('anon', p.oid, 'EXECUTE'))::text,
         '0',
         (SELECT count(*) FROM pg_proc p
          WHERE p.pronamespace = 'public'::regnamespace
            AND p.proname IN ('complete_order', 'cancel_invoice', 'log_audit_event',
                              'log_enquiry_status_change', 'backfill_customer_relationships',
                              'get_next_invoice_number', 'preview_next_invoice_number')
            AND has_function_privilege('anon', p.oid, 'EXECUTE')) = 0,
         'Run 027_security_hardening.sql'
  UNION ALL
  SELECT 16, '027', 'SECURITY DEFINER functions without a fixed search_path',
         (SELECT count(*) FROM pg_proc p
          WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
            AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg
                            WHERE cfg LIKE 'search_path=%'))::text,
         '0',
         (SELECT count(*) FROM pg_proc p
          WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
            AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg
                            WHERE cfg LIKE 'search_path=%')) = 0,
         'Run 027_security_hardening.sql (re-run it after adding any new SECURITY DEFINER function)'
  UNION ALL
  SELECT 17, '027', 'invoice_number_counters has RLS on',
         coalesce((SELECT relrowsecurity FROM pg_class
                   WHERE oid = to_regclass('public.invoice_number_counters')), true)::text,
         'true',
         coalesce((SELECT relrowsecurity FROM pg_class
                   WHERE oid = to_regclass('public.invoice_number_counters')), true),
         'Run 027_security_hardening.sql'

  -- ── 028: business correctness ─────────────────────────────────────────────
  UNION ALL
  SELECT 20, '028', 'canonical_phone() function exists',
         (to_regprocedure('public.canonical_phone(text)') IS NOT NULL)::text, 'true',
         to_regprocedure('public.canonical_phone(text)') IS NOT NULL,
         'Run 028_business_correctness.sql'
  UNION ALL
  SELECT 21, '028', 'refresh_customer_order_stats() function exists',
         (to_regprocedure('public.refresh_customer_order_stats(uuid)') IS NOT NULL)::text, 'true',
         to_regprocedure('public.refresh_customer_order_stats(uuid)') IS NOT NULL,
         'Run 028_business_correctness.sql'
  UNION ALL
  SELECT 22, '028', 'order-stats triggers on enquiries',
         (SELECT count(*) FROM pg_trigger
          WHERE tgrelid = 'public.enquiries'::regclass AND NOT tgisinternal
            AND tgname LIKE 'sync_customer_order_stats_%')::text,
         '3',
         (SELECT count(*) FROM pg_trigger
          WHERE tgrelid = 'public.enquiries'::regclass AND NOT tgisinternal
            AND tgname LIKE 'sync_customer_order_stats_%') = 3,
         'Run 028_business_correctness.sql'
  UNION ALL
  SELECT 23, '028', 'duplicate customers (same 10-digit number)',
         (SELECT count(*) FROM (SELECT canon FROM cust WHERE length(canon) = 10
                                GROUP BY canon HAVING count(*) > 1) d)::text,
         '0',
         (SELECT count(*) FROM (SELECT canon FROM cust WHERE length(canon) = 10
                                GROUP BY canon HAVING count(*) > 1) d) = 0,
         'Run 028_business_correctness.sql (merges them; nothing is deleted)'
  UNION ALL
  SELECT 24, '028', 'customer phones not stored as 10 digits',
         (SELECT count(*) FROM cust WHERE length(canon) = 10 AND phone <> canon)::text,
         '0',
         (SELECT count(*) FROM cust WHERE length(canon) = 10 AND phone <> canon) = 0,
         'Run 028_business_correctness.sql'
  UNION ALL
  SELECT 25, '028', 'customers whose total_orders ≠ completed enquiries',
         (SELECT count(*) FROM cust c
          WHERE coalesce(c.total_orders, 0) <> (SELECT count(*) FROM public.enquiries e
                                                WHERE e.customer_id = c.id AND e.status = 'COMPLETED'))::text,
         '0',
         (SELECT count(*) FROM cust c
          WHERE coalesce(c.total_orders, 0) <> (SELECT count(*) FROM public.enquiries e
                                                WHERE e.customer_id = c.id AND e.status = 'COMPLETED')) = 0,
         'Run 028_business_correctness.sql (the triggers keep it right afterwards)'
  UNION ALL
  SELECT 26, '028', 'sample (placeholder) reviews still shown on the site',
         (SELECT count(*) FROM public.reviews
          WHERE is_approved AND customer_phone IS NULL
            AND customer_name IN ('Murugan K.', 'Kavitha R.', 'Senthil M.',
                                  'முருகன் K.', 'கவிதா R.', 'செந்தில் M.'))::text,
         '0',
         (SELECT count(*) FROM public.reviews
          WHERE is_approved AND customer_phone IS NULL
            AND customer_name IN ('Murugan K.', 'Kavitha R.', 'Senthil M.',
                                  'முருகன் K.', 'கவிதா R.', 'செந்தில் M.')) = 0,
         'Run 028_business_correctness.sql'

  -- ── Information ───────────────────────────────────────────────────────────
  UNION ALL
  SELECT 30, 'info', 'enquiries saved from the website (latest)',
         coalesce((SELECT max(created_at)::text FROM public.enquiries WHERE source = 'WEBSITE'), 'none'),
         '-', NULL, ''
  UNION ALL
  SELECT 31, 'info', 'approved reviews shown on the site',
         (SELECT count(*) FROM public.reviews WHERE is_approved)::text, '-', NULL,
         'Approve real reviews in Admin → Reviews'
)
SELECT migration,
       check_name,
       actual,
       expected,
       CASE WHEN ok IS NULL THEN 'ℹ️' WHEN ok THEN '✅' ELSE '❌' END AS ok,
       CASE WHEN ok IS FALSE THEN how_to_fix ELSE '' END AS how_to_fix
FROM checks
ORDER BY n;
