-- =============================================================================
-- Migration 028: Business correctness (Phase 2)
--
-- 1. Customers keyed by canonical phone (last 10 digits)
--    "+91 98765 43210", "919876543210" and "9876543210" were stored as three
--    different customers. Existing duplicates are MERGED (all enquiries,
--    invoices and payments re-pointed to the oldest record — nothing is lost),
--    then every phone is rewritten to its canonical form. The existing UNIQUE
--    constraint on customers.phone then enforces one customer per number.
--
-- 2. Customer order stats maintained by the database
--    customers.total_orders used to be +1 on EVERY enquiry (the admin labels
--    it "Total Events"), and first/last_order_date were never set. A trigger
--    now keeps them equal to the customer's COMPLETED enquiries — whether
--    completed via "Complete Order" (complete_order()) or a status change.
--
-- 3. Placeholder reviews hidden from the public site
--    The seeded sample reviews (Murugan K., Kavitha R., Senthil M. and their
--    Tamil-name variants) were shown as if real. They are set to NOT approved
--    (not deleted) — admins can still see / delete them under Reviews.
--
-- Idempotent: safe to re-run.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Canonical phone + merge duplicates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.canonical_phone(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE WHEN length(d) > 10 THEN right(d, 10) ELSE d END
  FROM (SELECT regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') AS d) s
$$;

COMMENT ON FUNCTION public.canonical_phone(TEXT) IS
  'Last 10 digits of an Indian phone number (strips +91 / 0 / spaces). Matches lib/phone.ts normalizeIndianPhone().';

DO $$
DECLARE
  grp       RECORD;
  fk        RECORD;
  keeper    UUID;
  losers    UUID[];
  merged    INT := 0;
BEGIN
  FOR grp IN
    SELECT public.canonical_phone(phone) AS key,
           array_agg(id ORDER BY created_at, id) AS ids
    FROM public.customers
    -- Only real 10-digit mobile numbers: never merge customers whose phone
    -- is blank / malformed just because those reduce to the same string.
    WHERE length(public.canonical_phone(phone)) = 10
    GROUP BY public.canonical_phone(phone)
    HAVING count(*) > 1
  LOOP
    keeper := grp.ids[1];
    losers := grp.ids[2:array_length(grp.ids, 1)];

    -- Re-point EVERY foreign key that references customers (found
    -- dynamically, so tables added later are covered too).
    FOR fk IN
      SELECT c.conrelid::regclass AS tbl, a.attname AS col
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND c.confrelid = 'public.customers'::regclass
    LOOP
      EXECUTE format('UPDATE %s SET %I = $1 WHERE %I = ANY($2)', fk.tbl, fk.col, fk.col)
      USING keeper, losers;
    END LOOP;

    -- Keep any details the keeper is missing.
    UPDATE public.customers k
    SET email    = COALESCE(k.email,    (SELECT email    FROM public.customers WHERE id = ANY(losers) AND email    IS NOT NULL LIMIT 1)),
        whatsapp = COALESCE(k.whatsapp, (SELECT whatsapp FROM public.customers WHERE id = ANY(losers) AND whatsapp IS NOT NULL LIMIT 1)),
        notes    = NULLIF(concat_ws(E'\n', k.notes, (SELECT string_agg(notes, E'\n') FROM public.customers WHERE id = ANY(losers) AND notes IS NOT NULL)), '')
    WHERE k.id = keeper;

    DELETE FROM public.customers WHERE id = ANY(losers);
    merged := merged + array_length(losers, 1);
  END LOOP;

  UPDATE public.customers
  SET phone = public.canonical_phone(phone)
  WHERE length(public.canonical_phone(phone)) = 10
    AND phone IS DISTINCT FROM public.canonical_phone(phone);

  RAISE NOTICE 'Customers: merged % duplicate record(s); phones canonicalised.', merged;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Order stats (total_orders = completed enquiries)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_customer_order_stats(p_customer UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE customers c
  SET total_orders     = s.cnt,
      first_order_date = s.first_at,
      last_order_date  = s.last_at
  FROM (
    SELECT count(*)::INT                                   AS cnt,
           min(COALESCE(e.event_date::timestamptz, e.updated_at)) AS first_at,
           max(COALESCE(e.event_date::timestamptz, e.updated_at)) AS last_at
    FROM enquiries e
    WHERE e.customer_id = p_customer
      AND e.status = 'COMPLETED'
  ) s
  WHERE c.id = p_customer;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_customer_order_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.customer_id IS NOT NULL THEN
    PERFORM refresh_customer_order_stats(OLD.customer_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.customer_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM refresh_customer_order_stats(NEW.customer_id);
  END IF;
  RETURN NULL; -- AFTER trigger
END;
$$;

DROP TRIGGER IF EXISTS sync_customer_order_stats_ins ON public.enquiries;
DROP TRIGGER IF EXISTS sync_customer_order_stats_upd ON public.enquiries;
DROP TRIGGER IF EXISTS sync_customer_order_stats_del ON public.enquiries;

CREATE TRIGGER sync_customer_order_stats_ins
  AFTER INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_customer_order_stats();

CREATE TRIGGER sync_customer_order_stats_upd
  AFTER UPDATE OF status, customer_id ON public.enquiries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.customer_id IS DISTINCT FROM NEW.customer_id)
  EXECUTE FUNCTION public.trg_sync_customer_order_stats();

CREATE TRIGGER sync_customer_order_stats_del
  AFTER DELETE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_customer_order_stats();

-- Not callable through the public API (anon key); triggers still fire.
REVOKE ALL ON FUNCTION public.refresh_customer_order_stats(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_customer_order_stats(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.trg_sync_customer_order_stats() FROM PUBLIC, anon, authenticated;

-- Backfill: recompute every customer from their completed enquiries.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.customers LOOP
    PERFORM public.refresh_customer_order_stats(c.id);
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Hide the seeded placeholder reviews (not deleted)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.reviews
SET is_approved = false
WHERE is_approved = true
  AND customer_phone IS NULL
  AND customer_name IN ('Murugan K.', 'Kavitha R.', 'Senthil M.',
                        'முருகன் K.', 'கவிதா R.', 'செந்தில் M.')
  AND (   review_en LIKE 'Very tasty food!%'
       OR review_en LIKE 'Good quality food, timely delivery!%'
       OR review_en LIKE 'Excellent service for our office event%');


-- =============================================================================
-- VERIFY (SQL editor):
--   -- no duplicate canonical phones left
--   SELECT canonical_phone(phone), count(*) FROM customers GROUP BY 1 HAVING count(*) > 1;
--   -- total_orders matches completed enquiries
--   SELECT c.name, c.total_orders,
--          (SELECT count(*) FROM enquiries e WHERE e.customer_id = c.id AND e.status = 'COMPLETED') AS completed
--   FROM customers c ORDER BY c.total_orders DESC LIMIT 20;
--   -- placeholder reviews hidden
--   SELECT customer_name, is_approved FROM reviews ORDER BY created_at;
-- =============================================================================
