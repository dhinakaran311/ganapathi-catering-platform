-- 013_payments.sql
-- Payment transaction system — Shri Ganapathi Mess
-- Every payment (advance, partial, final) is stored here.
-- Amount Received = SUM(amount WHERE status = 'VERIFIED')
-- Balance Due     = invoice.total_amount - Amount Received

-- ─────────────────────────────────────────────
-- CREATE: payments table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (look up enquiry/customer from the invoice server-side; never trust client)
  invoice_id  UUID REFERENCES invoices(id)   ON DELETE RESTRICT, -- prevent deletion of invoices that have payments
  enquiry_id  UUID REFERENCES enquiries(id)  ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id)  ON DELETE SET NULL,

  -- Amount (NUMERIC for financial safety — no floating-point)
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),

  -- Payment type: ADVANCE | PARTIAL | FINAL | OTHER
  payment_type TEXT NOT NULL DEFAULT 'ADVANCE'
    CHECK (payment_type IN ('ADVANCE', 'PARTIAL', 'FINAL', 'OTHER')),

  -- Payment method: UPI | CASH | BANK_TRANSFER | CHEQUE | OTHER
  payment_method TEXT NOT NULL DEFAULT 'CASH'
    CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')),

  -- Reference number (UTR, UPI TXN ID, cheque number, etc.)
  transaction_reference TEXT,

  -- When the payment was received (not when it was entered)
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Verification lifecycle: PENDING → VERIFIED | REJECTED
  -- Only VERIFIED payments count toward amount_received / balance_due
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),

  verified_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at   TIMESTAMPTZ,
  rejected_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at   TIMESTAMPTZ,
  rejection_reason TEXT,

  notes TEXT,

  -- Soft-delete — we never hard-delete financial records
  is_deleted BOOLEAN NOT NULL DEFAULT false,

  -- Backfill marker: true = migrated from invoice_data.advancePaid (legacy)
  is_legacy_migrated BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id   ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_enquiry_id   ON payments(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id  ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created_at   ON payments(created_at DESC);

-- ─────────────────────────────────────────────
-- HELPER VIEW: invoice payment summary
-- Use this to calculate amount_received + balance_due efficiently
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW invoice_payment_summary AS
SELECT
  i.id                                          AS invoice_id,
  i.invoice_number,
  i.total_amount,
  i.status                                      AS invoice_status,
  COALESCE(
    SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false),
    0
  )                                             AS amount_received,
  GREATEST(
    i.total_amount - COALESCE(
      SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false),
      0
    ),
    0
  )                                             AS balance_due,
  CASE
    WHEN COALESCE(
      SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false),
      0
    ) = 0 THEN 'UNPAID'
    WHEN COALESCE(
      SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false),
      0
    ) >= i.total_amount THEN 'PAID'
    ELSE 'PARTIALLY_PAID'
  END                                           AS payment_status,
  GREATEST(
    COALESCE(
      SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED' AND p.is_deleted = false),
      0
    ) - i.total_amount,
    0
  )                                             AS overpaid_amount,
  COUNT(p.id) FILTER (WHERE p.is_deleted = false) AS total_payment_count,
  COUNT(p.id) FILTER (WHERE p.status = 'PENDING' AND p.is_deleted = false) AS pending_payment_count
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.total_amount, i.status;

-- ─────────────────────────────────────────────
-- BACKFILL: Migrate legacy invoice_data.advancePaid → payments
-- Only runs for invoices where:
--   a) invoice_data->>'advancePaid' exists AND > 0
--   b) No existing payment record already exists for that invoice
-- Marks migrated records as is_legacy_migrated = true so we can track them.
-- ─────────────────────────────────────────────
DO $$
DECLARE
  inv RECORD;
  advance_amount NUMERIC;
  pay_method TEXT;
  upi_ref TEXT;
BEGIN
  FOR inv IN
    SELECT
      id,
      enquiry_id,
      customer_id,
      invoice_data,
      payment_method,
      upi_reference,
      created_at
    FROM invoices
    WHERE
      invoice_data IS NOT NULL
      AND (invoice_data->>'advancePaid') IS NOT NULL
      AND (invoice_data->>'advancePaid')::NUMERIC > 0
      AND NOT EXISTS (
        SELECT 1 FROM payments p
        WHERE p.invoice_id = invoices.id
        AND p.is_legacy_migrated = true
      )
  LOOP
    advance_amount := (inv.invoice_data->>'advancePaid')::NUMERIC;

    -- Map legacy lowercase payment method to new uppercase
    pay_method := CASE
      WHEN inv.payment_method = 'upi'           THEN 'UPI'
      WHEN inv.payment_method = 'cash'          THEN 'CASH'
      WHEN inv.payment_method = 'bank_transfer' THEN 'BANK_TRANSFER'
      WHEN inv.payment_method = 'cheque'        THEN 'CHEQUE'
      ELSE 'CASH'  -- safe default for ambiguous legacy data
    END;

    upi_ref := inv.upi_reference;

    INSERT INTO payments (
      invoice_id,
      enquiry_id,
      customer_id,
      amount,
      payment_type,
      payment_method,
      transaction_reference,
      payment_date,
      status,
      notes,
      is_legacy_migrated,
      created_at,
      updated_at
    ) VALUES (
      inv.id,
      inv.enquiry_id,
      inv.customer_id,
      advance_amount,
      'ADVANCE',
      pay_method,
      upi_ref,
      COALESCE(inv.created_at, NOW()),
      'VERIFIED',  -- Legacy advances are considered verified (already received)
      'Migrated from invoice_data.advancePaid (legacy)',
      true,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- RLS: payments table — admin only, never public
-- ─────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can read payments
CREATE POLICY "Admin can view payments" ON payments
  FOR SELECT USING (is_admin());

-- Only authenticated admins can insert payments
CREATE POLICY "Admin can insert payments" ON payments
  FOR INSERT WITH CHECK (is_admin());

-- Only authenticated admins can update payments (e.g., verify/reject)
CREATE POLICY "Admin can update payments" ON payments
  FOR UPDATE USING (is_admin());

-- Physical deletion is blocked — use is_deleted = true instead
-- No DELETE policy means DELETE is denied for everyone including admins via RLS.
-- The service role bypasses RLS and must never hard-delete payment records.
