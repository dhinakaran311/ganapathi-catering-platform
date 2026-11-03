-- 015_fix_customer_relationships.sql
-- Fix customer → enquiry relationship to use customer_id instead of phone matching
-- Critical: Ensures data integrity and proper foreign key relationships

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Rename customer_id_ref to customer_id (if exists)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Check if column is named customer_id_ref and rename to customer_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'enquiries' 
      AND column_name = 'customer_id_ref'
  ) THEN
    ALTER TABLE enquiries RENAME COLUMN customer_id_ref TO customer_id;
    RAISE NOTICE 'Renamed customer_id_ref to customer_id';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Ensure customer_id column exists with proper foreign key
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE enquiries 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

COMMENT ON COLUMN enquiries.customer_id IS 
  'Foreign key to customers table. This is the canonical relationship, NOT phone matching.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create index for efficient customer history queries
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_enquiries_customer_id ON enquiries(customer_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Backfill customer_id based on phone normalization
-- WARNING: This uses phone matching to establish initial relationships
-- After this migration, phone should ONLY be used for customer discovery,
-- NOT for querying customer history
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create phone normalization function for matching
CREATE OR REPLACE FUNCTION normalize_phone(phone_number TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-numeric characters
  RETURN regexp_replace(phone_number, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill customer_id for enquiries
DO $$
DECLARE
  matched_count INT := 0;
  unmatched_count INT := 0;
  ambiguous_count INT := 0;
  rec RECORD;
  customer_matches INT;
BEGIN
  RAISE NOTICE '=== Starting customer_id backfill ===';
  
  -- Loop through enquiries without customer_id
  FOR rec IN 
    SELECT id, phone, name
    FROM enquiries
    WHERE customer_id IS NULL
      AND phone IS NOT NULL
  LOOP
    -- Count matching customers by normalized phone
    SELECT COUNT(*) INTO customer_matches
    FROM customers c
    WHERE normalize_phone(c.phone) = normalize_phone(rec.phone);
    
    IF customer_matches = 1 THEN
      -- Single match: safe to link
      UPDATE enquiries e
      SET customer_id = c.id
      FROM customers c
      WHERE e.id = rec.id
        AND normalize_phone(c.phone) = normalize_phone(rec.phone);
      
      matched_count := matched_count + 1;
      
    ELSIF customer_matches > 1 THEN
      -- Multiple customers with same phone: ambiguous
      ambiguous_count := ambiguous_count + 1;
      RAISE NOTICE 'Ambiguous match for enquiry % (phone: %) - % customers found', 
        rec.id, rec.phone, customer_matches;
      
    ELSE
      -- No matching customer
      unmatched_count := unmatched_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== Backfill complete ===';
  RAISE NOTICE 'Matched and linked: % enquiries', matched_count;
  RAISE NOTICE 'Ambiguous (multiple customers): % enquiries', ambiguous_count;
  RAISE NOTICE 'No matching customer: % enquiries', unmatched_count;
  
  IF ambiguous_count > 0 THEN
    RAISE NOTICE 'WARNING: % enquiries with ambiguous customer matches require manual review', ambiguous_count;
  END IF;
  
  IF unmatched_count > 0 THEN
    RAISE NOTICE 'INFO: % enquiries without matching customer (normal for new enquiries)', unmatched_count;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create view for enquiries requiring manual customer assignment
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW enquiries_without_customer AS
SELECT 
  e.id,
  e.name,
  e.phone,
  e.event_type,
  e.event_date,
  e.created_at,
  COUNT(c.id) as potential_customers
FROM enquiries e
LEFT JOIN customers c ON normalize_phone(e.phone) = normalize_phone(c.phone)
WHERE e.customer_id IS NULL
  AND e.phone IS NOT NULL
GROUP BY e.id, e.name, e.phone, e.event_type, e.event_date, e.created_at
ORDER BY e.created_at DESC;

COMMENT ON VIEW enquiries_without_customer IS 
  'Enquiries that need manual customer assignment. Review these periodically.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Verification query
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  total_enquiries INT;
  linked_enquiries INT;
  link_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_enquiries FROM enquiries;
  SELECT COUNT(*) INTO linked_enquiries FROM enquiries WHERE customer_id IS NOT NULL;
  
  IF total_enquiries > 0 THEN
    link_percentage := ROUND((linked_enquiries::NUMERIC / total_enquiries::NUMERIC) * 100, 2);
  ELSE
    link_percentage := 0;
  END IF;
  
  RAISE NOTICE '=== Customer Relationship Status ===';
  RAISE NOTICE 'Total enquiries: %', total_enquiries;
  RAISE NOTICE 'Linked to customers: % (% %%)', linked_enquiries, link_percentage;
  RAISE NOTICE 'Unlinked: %', total_enquiries - linked_enquiries;
END $$;
