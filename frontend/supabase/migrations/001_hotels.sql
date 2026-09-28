-- 001_hotels.sql
-- Core hotel/business record table

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ta TEXT,
  description_en TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address_ta TEXT,
  address_en TEXT,
  latitude FLOAT,
  longitude FLOAT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
