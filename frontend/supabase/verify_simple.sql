-- Simple verification for Phase 1 & 2 migrations

SELECT '=== MIGRATION 015: Customer Relationships ===' as check_section;

-- Check customer_id column
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'enquiries' AND column_name = 'customer_id'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enquiries' AND column_name = 'customer_id_ref'
      )
    ) THEN '✓ customer_id renamed successfully'
    ELSE '✗ customer_id rename FAILED'
  END as result;

-- Check index
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'enquiries' AND indexname = 'idx_enquiries_customer_id'
    ) THEN '✓ Index idx_enquiries_customer_id exists'
    ELSE '✗ Index MISSING'
  END as result;

-- Customer linkage stats
SELECT 
  '✓ Enquiries linked: ' || COUNT(customer_id) || ' / ' || COUNT(*) || 
  ' (' || ROUND((COUNT(customer_id)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1) || '%)' as result
FROM enquiries;

SELECT '=== MIGRATION 016: Atomic Invoice Numbering ===' as check_section;

-- Check counter table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'invoice_number_counters'
    ) THEN '✓ invoice_number_counters table exists'
    ELSE '✗ Table MISSING'
  END as result;

-- Show next invoice number
SELECT '✓ Next invoice: ' || preview_next_invoice_number() as result;

-- Check for duplicates
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ No duplicate invoice numbers'
    ELSE '✗ Found ' || COUNT(*) || ' duplicates'
  END as result
FROM (
  SELECT invoice_number
  FROM invoices
  GROUP BY invoice_number
  HAVING COUNT(*) > 1
) dups;

SELECT '=== MIGRATION 017: Invoice Soft Delete ===' as check_section;

-- Check soft delete columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('is_deleted', 'cancelled_at', 'cancelled_by')
    ) THEN '✓ Soft delete columns exist'
    ELSE '✗ Columns MISSING'
  END as result;

-- Check views
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_invoices')
    AND EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'cancelled_invoices')
    THEN '✓ Invoice views exist'
    ELSE '✗ Views MISSING'
  END as result;

-- Check RLS policy
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'invoices' 
      AND policyname = 'Prevent physical invoice deletion'
    ) THEN '✓ RLS deletion protection enabled'
    ELSE '✗ RLS policy MISSING'
  END as result;

SELECT '=== MIGRATION 018: Audit System ===' as check_section;

-- Check audit enhancements
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'audit_logs' AND column_name = 'metadata'
    ) THEN '✓ Audit metadata column exists'
    ELSE '✗ Column MISSING'
  END as result;

-- Check functions
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event')
    THEN '✓ log_audit_event() function exists'
    ELSE '✗ Function MISSING'
  END as result;

-- Check views
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'invoice_audit_trail')
    AND EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'payment_audit_trail')
    THEN '✓ Audit trail views exist'
    ELSE '✗ Views MISSING'
  END as result;

-- Audit stats
SELECT 
  '✓ Total audit events: ' || COUNT(*) || ', Actions: ' || COUNT(DISTINCT action) as result
FROM audit_logs;

SELECT '=== ALL MIGRATIONS COMPLETE ===' as check_section;
