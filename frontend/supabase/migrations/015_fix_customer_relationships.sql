-- Migration: Fix Customer Relationships (Version 2 - Corrected)
-- Description: Properly rename customer_id_ref to customer_id, handling existing customer_id column
-- Phase: 1 - Database Schema
-- Dependencies: Requires migrations 007 (customers) and 003 (enquiries)

-- ============================================================================
-- PART 1: Drop old customer_id column (not used, no foreign key)
-- ============================================================================

DO $$
BEGIN
  -- Check if old customer_id exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'enquiries' 
    AND column_name = 'customer_id'
    AND NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'enquiries'
        AND kcu.column_name = 'customer_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    )
  ) THEN
    RAISE NOTICE 'Dropping old customer_id column...';
    ALTER TABLE enquiries DROP COLUMN IF EXISTS customer_id;
  END IF;
END $$;

-- ============================================================================
-- PART 2: Rename customer_id_ref to customer_id
-- ============================================================================

DO $$
BEGIN
  -- Now rename customer_id_ref to customer_id
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'enquiries' 
    AND column_name = 'customer_id_ref'
  ) THEN
    RAISE NOTICE 'Renaming customer_id_ref to customer_id...';
    ALTER TABLE enquiries RENAME COLUMN customer_id_ref TO customer_id;
    
    -- Rename the foreign key constraint for clarity
    ALTER TABLE enquiries 
      RENAME CONSTRAINT enquiries_customer_id_ref_fkey 
      TO enquiries_customer_id_fkey;
  END IF;
END $$;

-- ============================================================================
-- PART 3: Create helper function for phone normalization
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove all non-numeric characters
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

COMMENT ON FUNCTION normalize_phone IS 'Removes non-numeric characters from phone numbers for consistent matching';

-- ============================================================================
-- PART 4: Backfill customer_id for existing enquiries
-- ============================================================================

-- Create temporary function to backfill customer relationships
CREATE OR REPLACE FUNCTION backfill_customer_relationships()
RETURNS TABLE (
  updated_count INTEGER,
  unmatched_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_unmatched INTEGER := 0;
BEGIN
  -- Update enquiries where customer_id is NULL but phone matches a customer
  WITH matched_customers AS (
    SELECT DISTINCT ON (normalize_phone(e.phone))
      e.id AS enquiry_id,
      c.id AS customer_id
    FROM enquiries e
    LEFT JOIN customers c 
      ON normalize_phone(e.phone) = normalize_phone(c.phone)
    WHERE e.customer_id IS NULL
      AND c.id IS NOT NULL
    ORDER BY normalize_phone(e.phone), c.created_at DESC
  )
  UPDATE enquiries e
  SET customer_id = mc.customer_id
  FROM matched_customers mc
  WHERE e.id = mc.enquiry_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Count remaining enquiries without customer_id
  SELECT COUNT(*)
  INTO v_unmatched
  FROM enquiries
  WHERE customer_id IS NULL;

  RETURN QUERY SELECT v_updated, v_unmatched;
END;
$$;

-- Execute backfill
DO $$
DECLARE
  backfill_result RECORD;
BEGIN
  SELECT * INTO backfill_result FROM backfill_customer_relationships();
  
  RAISE NOTICE 'Customer relationship backfill completed:';
  RAISE NOTICE '  - Updated: % enquiries', backfill_result.updated_count;
  RAISE NOTICE '  - Unmatched: % enquiries', backfill_result.unmatched_count;
  
  IF backfill_result.unmatched_count > 0 THEN
    RAISE NOTICE 'Note: Unmatched enquiries will be linked when customers are created via API';
  END IF;
END $$;

-- Drop temporary function
DROP FUNCTION IF EXISTS backfill_customer_relationships();

-- ============================================================================
-- PART 5: Create index for performance
-- ============================================================================

-- Create index on customer_id for faster joins
CREATE INDEX IF NOT EXISTS idx_enquiries_customer_id 
  ON enquiries(customer_id) 
  WHERE customer_id IS NOT NULL;

COMMENT ON INDEX idx_enquiries_customer_id IS 'Speeds up customer history queries and joins';

-- ============================================================================
-- PART 6: Update RLS policies to use customer_id
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Customers can view their own enquiries" ON enquiries;

-- Create new policy using customer_id
CREATE POLICY "Customers can view their own enquiries"
  ON enquiries
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR 
    -- Fallback for enquiries without customer_id (legacy data)
    (customer_id IS NULL AND phone IN (
      SELECT phone FROM customers WHERE id = auth.uid()
    ))
  );

COMMENT ON POLICY "Customers can view their own enquiries" ON enquiries IS 
  'Allows customers to view their enquiries using customer_id foreign key';

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 015 (v2) completed successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Dropped old customer_id column';
  RAISE NOTICE '  ✓ Renamed customer_id_ref → customer_id';
  RAISE NOTICE '  ✓ Created normalize_phone() helper function';
  RAISE NOTICE '  ✓ Backfilled customer relationships';
  RAISE NOTICE '  ✓ Created performance index';
  RAISE NOTICE '  ✓ Updated RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  → Apply migration 016 (atomic invoice numbering)';
  RAISE NOTICE '  → Apply migration 017 (invoice soft delete)';
  RAISE NOTICE '  → Apply migration 018 (audit event types)';
END $$;
