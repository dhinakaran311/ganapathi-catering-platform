-- =============================================================================
-- Migration 025: Business payment settings
--
-- Adds UPI / bank details to the hotels record so the invoice builder and
-- WhatsApp invoice sharing can show the hotel's standard payment info
-- (previously only stored per-invoice as legacy fields). OWNER/ADMIN only via
-- RLS (hotels admin policy).
-- =============================================================================

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;

COMMENT ON COLUMN hotels.upi_id IS 'Standard UPI ID shown on invoices / WhatsApp payment requests.';
COMMENT ON COLUMN hotels.bank_name IS 'Bank name for bank-transfer payments.';
COMMENT ON COLUMN hotels.bank_account_name IS 'Account holder name.';
COMMENT ON COLUMN hotels.bank_account_number IS 'Account number (sensitive — OWNER/ADMIN only via RLS).';
COMMENT ON COLUMN hotels.bank_ifsc IS 'IFSC code.';
