-- 003_enquiries.sql
-- Customer enquiry records

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  
  -- Customer details
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- Event details
  event_type TEXT, -- Wedding, Birthday, Corporate, Family Function, Community Event, Bulk Order
  event_date DATE,
  event_location TEXT,
  guest_count TEXT, -- stored as range string: "100-200"
  guest_count_min INT,
  guest_count_max INT,
  food_type TEXT, -- veg, nonveg, both
  meal_type TEXT, -- breakfast, lunch, dinner, snacks
  
  -- Enquiry details
  message TEXT,
  custom_items TEXT[], -- D25: custom food items
  
  -- Admin tracking
  status TEXT DEFAULT 'NEW', 
  -- NEW → CONTACTED → DISCUSSION → QUOTE_SENT → FOLLOW_UP → CONFIRMED → COMPLETED / CANCELLED
  tracking_code TEXT UNIQUE,
  admin_notes TEXT,
  auto_cancelled_reason TEXT,
  
  -- Source tracking
  source TEXT DEFAULT 'whatsapp', -- whatsapp, form, phone
  
  -- Customer link (added later via Category B E40)
  customer_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enquiry status history (B13)
CREATE TABLE IF NOT EXISTS enquiry_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_tracking_code
  BEFORE INSERT ON enquiries
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_code();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_hotel_id ON enquiries(hotel_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON enquiries(phone);
CREATE INDEX IF NOT EXISTS idx_enquiries_tracking_code ON enquiries(tracking_code);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiry_status_history_enquiry_id ON enquiry_status_history(enquiry_id);
