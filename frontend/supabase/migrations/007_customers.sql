-- 007_customers.sql
-- Customer database (Category B - E40)

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  email TEXT,
  total_orders INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  customer_type TEXT DEFAULT 'regular', -- regular, vip, corporate
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link enquiries to customers
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS customer_id_ref UUID REFERENCES customers(id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
