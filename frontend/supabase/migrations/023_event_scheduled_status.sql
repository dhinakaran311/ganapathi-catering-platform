-- =============================================================================
-- Migration 023: EVENT_SCHEDULED enquiry status + audit enum additions
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add EVENT_SCHEDULED to enquiry status (the DB has no CHECK constraint
-- currently — confirmed by NULL enquiry_status_constraint in the audit). We add
-- one that matches what the application actually needs, preserving existing data.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Drop old constraint if it exists from migration 012
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'enquiries_status_check'
      AND conrelid = 'enquiries'::regclass
  ) THEN
    ALTER TABLE enquiries DROP CONSTRAINT enquiries_status_check;
    RAISE NOTICE 'Dropped old enquiries_status_check constraint';
  END IF;
END $$;

-- Add updated constraint including EVENT_SCHEDULED
ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_status_check
  CHECK (status IN (
    'NEW',
    'CONTACTED',
    'DISCUSSION',
    'QUOTE_SENT',
    'FOLLOW_UP',
    'CONFIRMED',
    'EVENT_SCHEDULED',
    'COMPLETED',
    'CANCELLED'
  ));

-- Same for enquiry_status_history.new_status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'enquiry_status_history_new_status_check'
      AND conrelid = 'enquiry_status_history'::regclass
  ) THEN
    ALTER TABLE enquiry_status_history DROP CONSTRAINT enquiry_status_history_new_status_check;
    RAISE NOTICE 'Dropped old enquiry_status_history_new_status_check constraint';
  END IF;
END $$;

ALTER TABLE enquiry_status_history
  ADD CONSTRAINT enquiry_status_history_new_status_check
  CHECK (new_status IN (
    'NEW', 'CONTACTED', 'DISCUSSION', 'QUOTE_SENT', 'FOLLOW_UP',
    'CONFIRMED', 'EVENT_SCHEDULED', 'COMPLETED', 'CANCELLED'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add missing audit_action enum values
-- ORDER_COMPLETED already added in migration 022.
-- Add: EVENT_COMPLETED, ROLE_CHANGED, ENQUIRY_ASSIGNED,
--      NEXT_ACTION_CREATED, NEXT_ACTION_UPDATED, NEXT_ACTION_COMPLETED
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_labels TEXT[] := ARRAY[
    'EVENT_COMPLETED',
    'ROLE_CHANGED',
    'ENQUIRY_ASSIGNED',
    'NEXT_ACTION_CREATED',
    'NEXT_ACTION_UPDATED',
    'NEXT_ACTION_COMPLETED',
    'PAYMENT_REVERSED'
  ];
  v_label TEXT;
BEGIN
  FOREACH v_label IN ARRAY v_labels LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'audit_action'::regtype
        AND enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE audit_action ADD VALUE %L', v_label);
      RAISE NOTICE 'Added % to audit_action enum', v_label;
    ELSE
      RAISE NOTICE '% already in audit_action enum', v_label;
    END IF;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Update complete_order() to also support EVENT_SCHEDULED
-- The function should not block completion from EVENT_SCHEDULED status
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
  v_amount_received NUMERIC;
  v_balance_due     NUMERIC;
  v_payment_status  TEXT;
  v_old_enq_status  TEXT;
  v_old_inv_status  TEXT;
  v_new_inv_status  TEXT;
  v_audit_id        UUID;
BEGIN
  -- Fetch enquiry
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

  IF v_enquiry.status = 'COMPLETED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is already completed');
  END IF;

  v_old_enq_status := v_enquiry.status;

  -- Find the most recent active invoice
  SELECT id, status, total_amount, invoice_number
  INTO v_invoice
  FROM invoices
  WHERE enquiry_id = p_enquiry_id
    AND is_deleted = false
    AND status != 'CANCELLED'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate real balance from payments (NEVER trusts client values)
  IF v_invoice.id IS NOT NULL THEN
    SELECT
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false), 0),
      GREATEST(v_invoice.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false), 0), 0)
    INTO v_amount_received, v_balance_due
    FROM payments p
    WHERE p.invoice_id = v_invoice.id;

    v_payment_status := CASE
      WHEN v_amount_received = 0 THEN 'UNPAID'
      WHEN v_amount_received >= v_invoice.total_amount THEN 'PAID'
      ELSE 'PARTIALLY_PAID'
    END;
  ELSE
    v_amount_received := 0;
    v_balance_due     := 0;
    v_payment_status  := 'UNPAID';
  END IF;

  -- Mark enquiry COMPLETED
  UPDATE enquiries
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE id = p_enquiry_id;

  -- Only mark invoice PAID if balance is actually zero
  v_new_inv_status := NULL;
  IF v_invoice.id IS NOT NULL THEN
    v_old_inv_status := v_invoice.status;
    IF v_balance_due = 0 AND v_amount_received > 0 AND v_invoice.status NOT IN ('PAID', 'CANCELLED') THEN
      UPDATE invoices
      SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
      WHERE id = v_invoice.id;
      v_new_inv_status := 'PAID';
    END IF;
  END IF;

  -- Audit log
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id,
    old_data, new_data, metadata, created_at
  ) VALUES (
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
  ) RETURNING id INTO v_audit_id;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Update upcoming_catering_events to include EVENT_SCHEDULED + location
-- Must DROP first because column list changed
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS upcoming_catering_events;

CREATE VIEW upcoming_catering_events AS
SELECT
  e.id                AS enquiry_id,
  e.name              AS customer_name,
  e.phone,
  e.event_type,
  e.event_date,
  e.guest_count,
  e.status            AS enquiry_status,
  e.event_location,
  i.id                AS invoice_id,
  i.invoice_number,
  i.total_amount,
  COALESCE(ips.amount_received, 0)  AS amount_received,
  COALESCE(ips.balance_due, 0)      AS balance_due,
  COALESCE(ips.payment_status, 'UNPAID') AS payment_status
FROM enquiries e
LEFT JOIN LATERAL (
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
  e.event_date >= CURRENT_DATE
  AND e.status NOT IN ('CANCELLED', 'COMPLETED')
ORDER BY e.event_date ASC;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '=== Migration 023 Complete ===';
  RAISE NOTICE 'EVENT_SCHEDULED added to enquiries.status CHECK constraint';
  RAISE NOTICE 'enquiry_status_history updated to include EVENT_SCHEDULED';
  RAISE NOTICE 'audit_action enum: EVENT_COMPLETED, ROLE_CHANGED, ENQUIRY_ASSIGNED, NEXT_ACTION_* added';
  RAISE NOTICE 'complete_order() updated to allow completion from EVENT_SCHEDULED';
  RAISE NOTICE 'upcoming_catering_events view updated to include EVENT_SCHEDULED events';
END $$;
