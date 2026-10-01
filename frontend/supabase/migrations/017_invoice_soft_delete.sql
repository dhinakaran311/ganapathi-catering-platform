-- 017_invoice_soft_delete.sql
-- Prevent physical deletion of invoices - use soft delete (status = CANCELLED)
-- Critical: Preserves financial audit trail and payment history

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Add soft delete columns to invoices
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

COMMENT ON COLUMN invoices.is_deleted IS 
  'Soft delete flag. true = logically deleted but record preserved for audit trail.';

COMMENT ON COLUMN invoices.deleted_at IS 
  'Timestamp when invoice was soft deleted.';

COMMENT ON COLUMN invoices.deleted_by IS 
  'Admin user who performed the soft deletion.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Add cancellation-specific columns
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN invoices.cancelled_at IS 
  'Timestamp when invoice status changed to CANCELLED.';

COMMENT ON COLUMN invoices.cancelled_by IS 
  'Admin user who cancelled the invoice.';

COMMENT ON COLUMN invoices.cancellation_reason IS 
  'Business reason for cancellation (e.g., "Customer cancelled event", "Duplicate invoice").';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create indexes for efficient queries
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_invoices_not_deleted 
  ON invoices(is_deleted) 
  WHERE is_deleted = false;

COMMENT ON INDEX idx_invoices_not_deleted IS 
  'Partial index for active (non-deleted) invoices. Improves query performance.';

CREATE INDEX IF NOT EXISTS idx_invoices_cancelled 
  ON invoices(status) 
  WHERE status = 'CANCELLED';

COMMENT ON INDEX idx_invoices_cancelled IS 
  'Partial index for cancelled invoices. Useful for reporting.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create view for active invoices (excludes soft-deleted)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW active_invoices AS
SELECT *
FROM invoices
WHERE is_deleted = false;

COMMENT ON VIEW active_invoices IS 
  'Active (non-deleted) invoices only. Use this for normal business queries.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create view for cancelled invoices (audit/reporting)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW cancelled_invoices AS
SELECT 
  i.*,
  u.email as cancelled_by_email,
  COUNT(p.id) as payment_count,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED'), 0) as total_received
FROM invoices i
LEFT JOIN auth.users u ON i.cancelled_by = u.id
LEFT JOIN payments p ON p.invoice_id = i.id AND p.is_deleted = false
WHERE i.status = 'CANCELLED' OR i.is_deleted = true
GROUP BY i.id, u.email;

COMMENT ON VIEW cancelled_invoices IS 
  'Cancelled invoices with payment summary. Used for audit and reporting.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Block physical deletion via RLS policy
-- ═══════════════════════════════════════════════════════════════════════════════

-- Remove any existing DELETE policies
DROP POLICY IF EXISTS "Admin can delete invoices" ON invoices;
DROP POLICY IF EXISTS "Service role can delete invoices" ON invoices;

-- Create policy that BLOCKS all deletions
CREATE POLICY "Prevent physical invoice deletion" ON invoices
  FOR DELETE 
  USING (false);  -- Always returns false = no one can delete

COMMENT ON POLICY "Prevent physical invoice deletion" ON invoices IS 
  'Physical deletion is blocked for everyone including admins. Use soft delete (is_deleted=true, status=CANCELLED) instead. Only service role with RLS bypass can delete during maintenance.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: Create helper function for soft delete (cancellation)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cancel_invoice(
  p_invoice_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  invoice_id UUID
) AS $$
DECLARE
  payment_count INT;
  invoice_status TEXT;
BEGIN
  -- Check if invoice exists
  SELECT status INTO invoice_status
  FROM invoices
  WHERE id = p_invoice_id;
  
  IF invoice_status IS NULL THEN
    RETURN QUERY SELECT false, 'Invoice not found', p_invoice_id;
    RETURN;
  END IF;
  
  -- Check if already cancelled
  IF invoice_status = 'CANCELLED' THEN
    RETURN QUERY SELECT false, 'Invoice already cancelled', p_invoice_id;
    RETURN;
  END IF;
  
  -- Count associated payments
  SELECT COUNT(*) INTO payment_count
  FROM payments
  WHERE invoice_id = p_invoice_id
    AND is_deleted = false;
  
  -- Perform soft delete
  UPDATE invoices
  SET 
    status = 'CANCELLED',
    is_deleted = true,
    cancelled_at = NOW(),
    cancelled_by = p_user_id,
    cancellation_reason = COALESCE(p_reason, 'Cancelled by admin'),
    updated_at = NOW()
  WHERE id = p_invoice_id;
  
  -- Return success with info
  IF payment_count > 0 THEN
    RETURN QUERY SELECT 
      true, 
      format('Invoice cancelled. %s payment record(s) preserved.', payment_count),
      p_invoice_id;
  ELSE
    RETURN QUERY SELECT 
      true, 
      'Invoice cancelled successfully.',
      p_invoice_id;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_invoice IS 
  'Safely cancels (soft deletes) an invoice while preserving all payment records. Returns success status and message.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: Verification
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  total_invoices INT;
  active_invoices_count INT;
  cancelled_invoices_count INT;
  deleted_invoices_count INT;
BEGIN
  SELECT COUNT(*) INTO total_invoices FROM invoices;
  SELECT COUNT(*) INTO active_invoices_count FROM invoices WHERE is_deleted = false;
  SELECT COUNT(*) INTO cancelled_invoices_count FROM invoices WHERE status = 'CANCELLED';
  SELECT COUNT(*) INTO deleted_invoices_count FROM invoices WHERE is_deleted = true;
  
  RAISE NOTICE '=== Invoice Status Summary ===';
  RAISE NOTICE 'Total invoices: %', total_invoices;
  RAISE NOTICE 'Active invoices: %', active_invoices_count;
  RAISE NOTICE 'Cancelled invoices: %', cancelled_invoices_count;
  RAISE NOTICE 'Soft-deleted invoices: %', deleted_invoices_count;
  RAISE NOTICE 'Physical deletion: BLOCKED by RLS policy';
END $$;
