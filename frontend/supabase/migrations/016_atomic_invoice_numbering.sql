-- 016_atomic_invoice_numbering.sql
-- Replace COUNT(*) + 1 with atomic PostgreSQL counter mechanism
-- Critical: Prevents duplicate invoice numbers under concurrent load

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create invoice number counter table
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invoice_number_counters (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invoice_number_counters IS 
  'Atomic counter for invoice number generation. One row per year for yearly reset.';

COMMENT ON COLUMN invoice_number_counters.last_number IS 
  'Last assigned number for this year. Next invoice gets last_number + 1.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Initialize counter for current year based on existing invoices
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  current_year INT;
  max_number INT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  
  -- Find highest invoice number for current year
  SELECT COALESCE(MAX(
    CAST(split_part(invoice_number, '-', 3) AS INT)
  ), 0)
  INTO max_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year::TEXT || '-%';
  
  -- Initialize counter
  INSERT INTO invoice_number_counters (year, last_number, updated_at)
  VALUES (current_year, max_number, NOW())
  ON CONFLICT (year) DO NOTHING;
  
  RAISE NOTICE 'Initialized invoice counter for year %: last_number = %', current_year, max_number;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create atomic number generation function
-- This function is CONCURRENCY SAFE using INSERT ... ON CONFLICT ... DO UPDATE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INT;
  next_num INT;
  invoice_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  
  -- Atomically increment and return the counter
  -- This is THE critical operation that prevents race conditions
  INSERT INTO invoice_number_counters (year, last_number, updated_at)
  VALUES (current_year, 1, NOW())
  ON CONFLICT (year) DO UPDATE
    SET last_number = invoice_number_counters.last_number + 1,
        updated_at = NOW()
  RETURNING last_number INTO next_num;
  
  -- Format: INV-2026-0001
  invoice_num := 'INV-' || current_year || '-' || lpad(next_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_invoice_number() IS 
  'Atomically generates next invoice number for current year. CONCURRENCY SAFE.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Replace old trigger function with new atomic version
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop old trigger and function
DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
DROP FUNCTION IF EXISTS generate_invoice_number();

-- Create new trigger function using atomic counter
CREATE OR REPLACE FUNCTION generate_invoice_number_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := get_next_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_invoice_number_v2
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number_v2();

COMMENT ON TRIGGER set_invoice_number_v2 ON invoices IS 
  'Auto-generates invoice number using atomic counter. Prevents duplicate numbers.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Verify existing invoices have unique numbers
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  duplicate_count INT;
  duplicate_examples TEXT;
BEGIN
  -- Check for duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT invoice_number, COUNT(*) as cnt
    FROM invoices
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    -- Get examples of duplicates
    SELECT string_agg(invoice_number, ', ')
    INTO duplicate_examples
    FROM (
      SELECT invoice_number
      FROM invoices
      GROUP BY invoice_number
      HAVING COUNT(*) > 1
      LIMIT 5
    ) dups;
    
    RAISE EXCEPTION 
      'Found % duplicate invoice numbers. Examples: %. Fix manually before proceeding.', 
      duplicate_count, 
      duplicate_examples;
  ELSE
    RAISE NOTICE 'Verification passed: All invoice numbers are unique';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Create helper function to preview next invoice number (without consuming)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION preview_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INT;
  next_num INT;
  invoice_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  
  -- Get current counter value without incrementing
  SELECT COALESCE(last_number, 0) + 1
  INTO next_num
  FROM invoice_number_counters
  WHERE year = current_year;
  
  -- If no row exists, next number will be 1
  IF next_num IS NULL THEN
    next_num := 1;
  END IF;
  
  invoice_num := 'INV-' || current_year || '-' || lpad(next_num::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preview_next_invoice_number() IS 
  'Preview the next invoice number without consuming it. Useful for UI display.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: Test the atomic counter
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  test_num1 TEXT;
  test_num2 TEXT;
  test_num3 TEXT;
BEGIN
  RAISE NOTICE '=== Testing atomic invoice number generation ===';
  
  -- Preview next number
  SELECT preview_next_invoice_number() INTO test_num1;
  RAISE NOTICE 'Next invoice number (preview): %', test_num1;
  
  -- The actual invoice creation will consume numbers through the trigger
  -- This just verifies the function works
  RAISE NOTICE 'Atomic counter ready. Next INSERT will generate: %', test_num1;
END $$;
