-- 014_invoice_status_canonical.sql
-- Migrate invoice status from legacy lowercase to canonical uppercase values.
--
-- Old values:
--   draft    → DRAFT
--   pending  → DRAFT  (pending meant "created, not yet sent")
--   sent     → SENT
--   paid     → PAID
--   cancelled→ CANCELLED
--
-- Also drops the old payment columns from invoices (now handled by payments table).
-- We keep them for now and just null them out — full column removal can happen after
-- verifying the backfill in 013_payments.sql completed successfully.

-- ── Step 1: Migrate existing status values ──
UPDATE invoices SET status = 'DRAFT'     WHERE status = 'draft';
UPDATE invoices SET status = 'DRAFT'     WHERE status = 'pending';  -- pending = not yet sent = DRAFT
UPDATE invoices SET status = 'SENT'      WHERE status = 'sent';
UPDATE invoices SET status = 'PAID'      WHERE status = 'paid';
UPDATE invoices SET status = 'CANCELLED' WHERE status = 'cancelled';

-- ── Step 2: Add CHECK constraint so invalid values can never be inserted again ──
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'));

-- ── Step 3: Update the default so new invoices start as DRAFT ──
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'DRAFT';

-- ── Step 4: Update the invoice_payment_summary view to use uppercase values ──
-- (View is already correct — it reads invoice.status, not compares)
-- No change needed.
