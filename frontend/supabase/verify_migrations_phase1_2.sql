-- verify_migrations_phase1_2.sql
-- Verification queries for Phase 1 & 2 migrations

\echo '=========================================='
\echo 'Phase 1 & 2 Migration Verification'
\echo '=========================================='
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 015: Customer Relationships
-- ═══════════════════════════════════════════════════════════════════════════════
\echo '1. Checking customer relationships...'
\echo ''

-- Check if customer_id column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'enquiries' AND column_name = 'customer_id'
    ) THEN '✓ enquiries.customer_id column exists'
    ELSE '✗ enquiries.customer_id column MISSING'
  END as check_result;

-- Check if index exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'enquiries' AND indexname = 'idx_enquiries_customer_id'
    ) THEN '✓ idx_enquiries_customer_id index exists'
    ELSE '✗ idx_enquiries_customer_id index MISSING'
  END as check_result;

-- Show customer linkage statistics
\echo ''
\echo 'Customer linkage statistics:'
SELECT 
  COUNT(*) as total_enquiries,
  COUNT(customer_id) as linked_enquiries,
  COUNT(*) - COUNT(customer_id) as unlinked_enquiries,
  ROUND(
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(customer_id)::NUMERIC / COUNT(*)::NUMERIC) * 100 
      ELSE 0 
    END, 
    2
  ) as linkage_percentage
FROM enquiries;

-- Check normalize_phone function
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'normalize_phone'
    ) THEN '✓ normalize_phone() function exists'
    ELSE '✗ normalize_phone() function MISSING'
  END as check_result;

-- Test normalize_phone function
\echo ''
\echo 'Testing normalize_phone() function:'
SELECT 
  normalize_phone('+91 9942351280') as normalized_1,
  normalize_phone('9942351280') as normalized_2,
  normalize_phone('+919942351280') as normalized_3;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 016: Atomic Invoice Numbering
-- ═══════════════════════════════════════════════════════════════════════════════
\echo '2. Checking atomic invoice numbering...'
\echo ''

-- Check if counter table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'invoice_number_counters'
    ) THEN '✓ invoice_number_counters table exists'
    ELSE '✗ invoice_number_counters table MISSING'
  END as check_result;

-- Show current counter state
\echo ''
\echo 'Current invoice number counters:'
SELECT 
  year,
  last_number,
  'INV-' || year || '-' || lpad(last_number::TEXT, 4, '0') as last_invoice,
  'INV-' || year || '-' || lpad((last_number + 1)::TEXT, 4, '0') as next_invoice,
  updated_at
FROM invoice_number_counters
ORDER BY year DESC;

-- Check if new functions exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_next_invoice_number')
    THEN '✓ get_next_invoice_number() function exists'
    ELSE '✗ get_next_invoice_number() function MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'preview_next_invoice_number')
    THEN '✓ preview_next_invoice_number() function exists'
    ELSE '✗ preview_next_invoice_number() function MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_invoice_number_v2')
    THEN '✓ generate_invoice_number_v2() function exists'
    ELSE '✗ generate_invoice_number_v2() function MISSING'
  END as check_result;

-- Check if old function is removed
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_invoice_number')
    THEN '✓ Old generate_invoice_number() removed'
    ELSE '✗ Old generate_invoice_number() still exists (should be removed)'
  END as check_result;

-- Test preview function
\echo ''
\echo 'Next invoice number (preview):'
SELECT preview_next_invoice_number();

-- Check for duplicate invoice numbers
\echo ''
\echo 'Checking for duplicate invoice numbers:'
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ No duplicate invoice numbers found'
    ELSE '✗ Found ' || COUNT(*) || ' duplicate invoice numbers'
  END as check_result
FROM (
  SELECT invoice_number, COUNT(*) as cnt
  FROM invoices
  GROUP BY invoice_number
  HAVING COUNT(*) > 1
) duplicates;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 017: Invoice Soft Delete
-- ═══════════════════════════════════════════════════════════════════════════════
\echo '3. Checking invoice soft delete...'
\echo ''

-- Check if soft delete columns exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'is_deleted'
    ) THEN '✓ invoices.is_deleted column exists'
    ELSE '✗ invoices.is_deleted column MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'cancelled_at'
    ) THEN '✓ invoices.cancelled_at column exists'
    ELSE '✗ invoices.cancelled_at column MISSING'
  END as check_result;

-- Check if indexes exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'invoices' AND indexname = 'idx_invoices_not_deleted'
    ) THEN '✓ idx_invoices_not_deleted index exists'
    ELSE '✗ idx_invoices_not_deleted index MISSING'
  END as check_result;

-- Check if views exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_invoices')
    THEN '✓ active_invoices view exists'
    ELSE '✗ active_invoices view MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'cancelled_invoices')
    THEN '✓ cancelled_invoices view exists'
    ELSE '✗ cancelled_invoices view MISSING'
  END as check_result;

-- Check if cancel_invoice function exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cancel_invoice')
    THEN '✓ cancel_invoice() function exists'
    ELSE '✗ cancel_invoice() function MISSING'
  END as check_result;

-- Check if RLS policy blocks deletion
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'invoices' 
        AND policyname = 'Prevent physical invoice deletion'
        AND cmd = 'DELETE'
    ) THEN '✓ RLS policy blocking deletion exists'
    ELSE '✗ RLS policy blocking deletion MISSING'
  END as check_result;

-- Show invoice deletion status
\echo ''
\echo 'Invoice deletion status:'
SELECT 
  COUNT(*) as total_invoices,
  COUNT(*) FILTER (WHERE is_deleted = false) as active_invoices,
  COUNT(*) FILTER (WHERE is_deleted = true) as deleted_invoices,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_invoices
FROM invoices;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 018: Audit Event Types
-- ═══════════════════════════════════════════════════════════════════════════════
\echo '4. Checking audit system...'
\echo ''

-- Check if audit_logs enhancements exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'audit_logs' AND column_name = 'metadata'
    ) THEN '✓ audit_logs.metadata column exists'
    ELSE '✗ audit_logs.metadata column MISSING'
  END as check_result;

-- Check if log_audit_event function exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event')
    THEN '✓ log_audit_event() function exists'
    ELSE '✗ log_audit_event() function MISSING'
  END as check_result;

-- Check if audit views exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'recent_audit_events')
    THEN '✓ recent_audit_events view exists'
    ELSE '✗ recent_audit_events view MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'invoice_audit_trail')
    THEN '✓ invoice_audit_trail view exists'
    ELSE '✗ invoice_audit_trail view MISSING'
  END as check_result;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'payment_audit_trail')
    THEN '✓ payment_audit_trail view exists'
    ELSE '✗ payment_audit_trail view MISSING'
  END as check_result;

-- Check helper functions
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_audit_summary')
    THEN '✓ get_audit_summary() function exists'
    ELSE '✗ get_audit_summary() function MISSING'
  END as check_result;

-- Show audit log statistics
\echo ''
\echo 'Audit log statistics:'
SELECT 
  COUNT(*) as total_audit_events,
  COUNT(DISTINCT action) as distinct_actions,
  COUNT(DISTINCT user_id) as distinct_users,
  MIN(created_at) as oldest_event,
  MAX(created_at) as newest_event
FROM audit_logs;

-- Show most common actions
\echo ''
\echo 'Most common audit actions (top 10):'
SELECT 
  action,
  COUNT(*) as count
FROM audit_logs
GROUP BY action
ORDER BY count DESC
LIMIT 10;

\echo ''
\echo '=========================================='
\echo 'Verification Complete'
\echo '=========================================='
\echo ''
\echo 'Review the results above. All checks should show ✓'
\echo 'If any show ✗, review the corresponding migration file.'
\echo ''
