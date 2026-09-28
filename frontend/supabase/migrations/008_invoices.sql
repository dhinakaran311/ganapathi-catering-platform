-- 008_invoices.sql
-- Invoice generation system (Category B - H69)

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Amounts
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Invoice content (JSON: line items, custom foods)
  invoice_data JSONB,
  
  -- PDF
  pdf_url TEXT,
  
  -- Status: pending, sent, paid, cancelled
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Payment
  payment_method TEXT, -- bank_transfer, upi, cash
  upi_reference TEXT,
  payment_verified_by UUID REFERENCES auth.users(id),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate invoice number: INV-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM invoices 
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  NEW.invoice_number = 'INV-' || year_part || '-' || lpad(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

CREATE INDEX IF NOT EXISTS idx_invoices_enquiry_id ON invoices(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
