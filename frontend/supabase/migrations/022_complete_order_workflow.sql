-- =============================================================================
-- Migration 022: Complete Order Workflow
-- Adds ORDER_COMPLETED to audit enum, complete_order() DB function,
-- and upcoming_events view for the dashboard widget.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add ORDER_COMPLETED to audit_action enum
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- ALTER TYPE ... ADD VALUE is safe to re-run only if value doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'audit_action'::regtype
      AND enumlabel = 'ORDER_COMPLETED'
  ) THEN
    ALTER TYPE audit_action ADD VALUE 'ORDER_COMPLETED';
    RAISE NOTICE 'Added ORDER_COMPLETED to audit_action enum';
  ELSE
    RAISE NOTICE 'ORDER_COMPLETED already in audit_action enum';
  END IF;
END $$;

-- Commit the enum change before using it in functions below
-- (ALTER TYPE ADD VALUE commits immediately in PostgreSQL 12+)

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: complete_order() DB function
-- Called from the API route. Performs all state changes atomically:
--   - Validates enquiry exists and is completable
--   - Calculates actual balance from payments (never trusts client values)
--   - Updates enquiry status to COMPLETED
--   - Optionally updates invoice status to PAID if fully settled
--   - Creates audit log entry
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_order(
  p_enquiry_id    UUID,
  p_user_id       UUID,
  p_notes         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enquiry         RECORD;
  v_invoice         RECORD;
  v_summary         RECORD;
  v_old_enq_status  TEXT;
  v_old_inv_status  TEXT;
  v_new_inv_status  TEXT;
  v_amount_received NUMERIC;
  v_balance_due     NUMERIC;
  v_payment_status  TEXT;
  v_audit_id        UUID;
BEGIN

  -- ── 1. Fetch enquiry ────────────────────────────────────────────────────
  SELECT id, status, name, event_type, event_date
  INTO v_enquiry
  FROM enquiries
  WHERE id = p_enquiry_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enquiry not found');
  END IF;

  IF v_enquiry.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot complete a cancelled order');
  END IF;

  v_old_enq_status := v_enquiry.status;

  -- ── 2. Find the active invoice for this enquiry ─────────────────────────
  SELECT id, status, total_amount, invoice_number
  INTO v_invoice
  FROM invoices
  WHERE enquiry_id = p_enquiry_id
    AND is_deleted = false
    AND status != 'CANCELLED'
  ORDER BY created_at DESC
  LIMIT 1;

  -- ── 3. Calculate real balance from payments (NEVER trust client) ─────────
  IF v_invoice.id IS NOT NULL THEN
    SELECT
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false), 0) AS amount_received,
      GREATEST(v_invoice.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false), 0), 0) AS balance_due
    INTO v_amount_received, v_balance_due
    FROM payments p
    WHERE p.invoice_id = v_invoice.id;

    -- Determine payment status
    IF v_amount_received = 0 THEN
      v_payment_status := 'UNPAID';
    ELSIF v_amount_received >= v_invoice.total_amount THEN
      v_payment_status := 'PAID';
    ELSE
      v_payment_status := 'PARTIALLY_PAID';
    END IF;
  ELSE
    v_amount_received := 0;
    v_balance_due     := 0;
    v_payment_status  := 'UNPAID';
  END IF;

  -- ── 4. Update enquiry status to COMPLETED ───────────────────────────────
  UPDATE enquiries
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE id = p_enquiry_id;

  -- ── 5. Update invoice status if appropriate ─────────────────────────────
  v_new_inv_status := NULL;

  IF v_invoice.id IS NOT NULL THEN
    v_old_inv_status := v_invoice.status;

    -- Only mark PAID if balance is actually zero (fully settled)
    IF v_balance_due = 0 AND v_amount_received > 0 AND v_invoice.status NOT IN ('PAID', 'CANCELLED') THEN
      UPDATE invoices
      SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
      WHERE id = v_invoice.id;
      v_new_inv_status := 'PAID';
    END IF;
    -- If balance exists, invoice remains as-is (SENT, PARTIALLY_PAID etc.)
  END IF;

  -- ── 6. Write audit log ──────────────────────────────────────────────────
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id,
    old_data, new_data, metadata, created_at
  )
  VALUES (
    p_user_id,
    'ORDER_COMPLETED',
    'enquiries',
    p_enquiry_id,
    jsonb_build_object('status', v_old_enq_status),
    jsonb_build_object(
      'status', 'COMPLETED',
      'invoice_id',         v_invoice.id,
      'invoice_number',     v_invoice.invoice_number,
      'invoice_old_status', v_old_inv_status,
      'invoice_new_status', COALESCE(v_new_inv_status, v_old_inv_status),
      'amount_received',    v_amount_received,
      'balance_due',        v_balance_due,
      'payment_status',     v_payment_status,
      'notes',              p_notes
    ),
    jsonb_build_object(
      'completed_by', p_user_id,
      'balance_outstanding', v_balance_due > 0,
      'notes', p_notes
    ),
    NOW()
  )
  RETURNING id INTO v_audit_id;

  -- ── 7. Return result ────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'success',              true,
    'enquiry_id',           p_enquiry_id,
    'old_enquiry_status',   v_old_enq_status,
    'new_enquiry_status',   'COMPLETED',
    'invoice_id',           v_invoice.id,
    'invoice_number',       v_invoice.invoice_number,
    'old_invoice_status',   v_old_inv_status,
    'new_invoice_status',   COALESCE(v_new_inv_status, v_old_inv_status),
    'amount_received',      v_amount_received,
    'balance_due',          v_balance_due,
    'payment_status',       v_payment_status,
    'audit_id',             v_audit_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION complete_order IS
  'Atomically completes an order: marks enquiry COMPLETED, marks invoice PAID only when balance=0.
   Never creates fake payments. All balance calculations come from the payments table.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: upcoming_events view — catering events in the future
-- Used by the dashboard Upcoming Events widget.
-- DIFFERENT from upcoming_followups (which is about follow-up tasks).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW upcoming_catering_events AS
SELECT
  e.id                AS enquiry_id,
  e.name              AS customer_name,
  e.phone,
  e.event_type,
  e.event_date,
  e.guest_count,
  e.status            AS enquiry_status,
  i.id                AS invoice_id,
  i.invoice_number,
  i.total_amount,
  COALESCE(ips.amount_received, 0)  AS amount_received,
  COALESCE(ips.balance_due, 0)      AS balance_due,
  COALESCE(ips.payment_status, 'UNPAID') AS payment_status
FROM enquiries e
LEFT JOIN LATERAL (
  -- Most recent active invoice for this enquiry
  SELECT id, invoice_number, total_amount
  FROM invoices
  WHERE enquiry_id = e.id
    AND is_deleted = false
    AND status != 'CANCELLED'
  ORDER BY created_at DESC
  LIMIT 1
) i ON true
LEFT JOIN invoice_payment_summary ips ON ips.invoice_id = i.id
WHERE
  e.event_date >= CURRENT_DATE          -- future or today
  AND e.status NOT IN ('CANCELLED', 'COMPLETED')
ORDER BY e.event_date ASC;

COMMENT ON VIEW upcoming_catering_events IS
  'Upcoming catering events (by event_date). Excludes cancelled and completed. Used by dashboard widget.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: monthly_payment_summary view — for financial reports
-- Aggregates VERIFIED payments by calendar month using payment_date
-- (NOT invoice creation date — per master prompt requirement)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_payment_summary AS
SELECT
  DATE_TRUNC('month', p.payment_date)::DATE   AS month_start,
  TO_CHAR(p.payment_date, 'Mon YYYY')          AS month_label,
  EXTRACT(YEAR FROM p.payment_date)::INT       AS year,
  EXTRACT(MONTH FROM p.payment_date)::INT      AS month_num,
  COUNT(DISTINCT p.id)                         AS payment_count,
  COALESCE(SUM(p.amount), 0)                   AS amount_received
FROM payments p
WHERE p.status = 'VERIFIED'
  AND p.is_deleted = false
GROUP BY
  DATE_TRUNC('month', p.payment_date),
  TO_CHAR(p.payment_date, 'Mon YYYY'),
  EXTRACT(YEAR FROM p.payment_date),
  EXTRACT(MONTH FROM p.payment_date)
ORDER BY month_start DESC;

COMMENT ON VIEW monthly_payment_summary IS
  'Monthly aggregation of VERIFIED payments using payment_date (not invoice date).
   October amount = money received in October, regardless of when invoice was created.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '=== Migration 022 Complete ===';
  RAISE NOTICE 'ORDER_COMPLETED added to audit_action enum';
  RAISE NOTICE 'complete_order() function created';
  RAISE NOTICE 'upcoming_catering_events view created';
  RAISE NOTICE 'monthly_payment_summary view created';
END $$;
