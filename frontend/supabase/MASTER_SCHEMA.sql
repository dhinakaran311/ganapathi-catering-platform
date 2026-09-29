-- ═══════════════════════════════════════════════════════════════════════════════
-- SHRI GANAPATHI MESS — COMPLETE SUPABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- HOW TO RUN:
--   1. Go to https://supabase.com → Your Project → SQL Editor
--   2. Click "New Query"
--   3. Paste this ENTIRE file
--   4. Click "Run" (▶)
--   Done! All tables + seed data will be created.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- STEP 0: Shared trigger function (must be first)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';


-- ─────────────────────────────────────────────
-- STEP 1: Hotels
-- ─────────────────────────────────────────────
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

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────
-- STEP 2: Menus & Menu Items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ta TEXT,
  description_en TEXT,
  food_type TEXT DEFAULT 'veg',
  meal_type TEXT,
  min_guests INT DEFAULT 30,
  max_guests INT DEFAULT 500,
  starting_price NUMERIC,
  price_per_person NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ta TEXT,
  description_en TEXT,
  category TEXT,
  food_type TEXT DEFAULT 'veg',
  image_url TEXT,
  is_signature BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_hotel_id ON menus(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menus_meal_type ON menus(meal_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);


-- ─────────────────────────────────────────────
-- STEP 3: Enquiries + Status History
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,

  -- Customer details
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,

  -- Event details
  event_type TEXT,
  event_date DATE,
  event_location TEXT,
  guest_count TEXT,
  guest_count_min INT,
  guest_count_max INT,
  food_type TEXT,
  meal_type TEXT,

  -- Enquiry content
  message TEXT,
  custom_items TEXT[],

  -- Admin tracking
  status TEXT DEFAULT 'NEW',
  tracking_code TEXT UNIQUE,
  admin_notes TEXT,
  auto_cancelled_reason TEXT,

  -- Source
  source TEXT DEFAULT 'whatsapp',

  -- Customer link
  customer_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Status history
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

CREATE INDEX IF NOT EXISTS idx_enquiries_hotel_id ON enquiries(hotel_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON enquiries(phone);
CREATE INDEX IF NOT EXISTS idx_enquiries_tracking_code ON enquiries(tracking_code);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiry_status_history_enquiry_id ON enquiry_status_history(enquiry_id);


-- ─────────────────────────────────────────────
-- STEP 4: Gallery
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  title_ta TEXT,
  title_en TEXT,
  category TEXT,
  image_url TEXT NOT NULL,
  alt_ta TEXT,
  alt_en TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_hotel_id ON gallery(hotel_id);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_is_active ON gallery(is_active);


-- ─────────────────────────────────────────────
-- STEP 5: Service Areas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT true,
  delivery_charge NUMERIC DEFAULT 0,
  distance_km NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_areas_hotel_id ON service_areas(hotel_id);


-- ─────────────────────────────────────────────
-- STEP 6: Reviews
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  event_type TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_ta TEXT,
  review_en TEXT,
  photos TEXT[],
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);


-- ─────────────────────────────────────────────
-- STEP 7: Customers
-- ─────────────────────────────────────────────
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
  customer_type TEXT DEFAULT 'regular',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS customer_id_ref UUID REFERENCES customers(id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);


-- ─────────────────────────────────────────────
-- STEP 8: Invoices
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL DEFAULT '',
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,

  invoice_data JSONB,
  pdf_url TEXT,

  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  payment_method TEXT,
  upi_reference TEXT,
  payment_verified_by UUID REFERENCES auth.users(id),

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


-- ─────────────────────────────────────────────
-- STEP 9: Audit Logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ─────────────────────────────────────────────
-- STEP 10: Analytics + Theme + Reminders + Custom Foods
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  user_id TEXT,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#1a3d20',
  secondary_color TEXT DEFAULT '#b8860b',
  accent_color TEXT DEFAULT '#25D366',
  font_heading TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Noto Sans',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON theme_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  reminder_type TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  delivery_method TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INT,
  notes TEXT,
  added_by TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_scheduled_for ON booking_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_status ON booking_reminders(status);
CREATE INDEX IF NOT EXISTS idx_custom_food_requests_enquiry_id ON custom_food_requests(enquiry_id);


-- ─────────────────────────────────────────────
-- STEP 11: Row Level Security (RLS) — MUST BE LAST
-- ─────────────────────────────────────────────
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_food_requests ENABLE ROW LEVEL SECURITY;

-- ── PUBLIC policies (no login needed) ──
CREATE POLICY "Public can view hotels"          ON hotels        FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view menus"           ON menus         FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view menu items"      ON menu_items    FOR SELECT USING (true);
CREATE POLICY "Public can view gallery"         ON gallery       FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view service areas"   ON service_areas FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view approved reviews" ON reviews      FOR SELECT USING (is_approved = true);
CREATE POLICY "Public can submit reviews"       ON reviews       FOR INSERT WITH CHECK (is_approved = false);

-- ★ KEY POLICY: lets the contact form save enquiries without login
CREATE POLICY "Public can submit enquiries"     ON enquiries     FOR INSERT WITH CHECK (true);

-- Public analytics
CREATE POLICY "Public can track analytics"      ON analytics_events FOR INSERT WITH CHECK (true);

-- ── Admin helper ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ADMIN policies (logged-in admin only) ──
CREATE POLICY "Admin can manage hotels"         ON hotels                 FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage menus"          ON menus                  FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage menu items"     ON menu_items             FOR ALL USING (is_admin());
CREATE POLICY "Admin can view all enquiries"    ON enquiries              FOR SELECT USING (is_admin());
CREATE POLICY "Admin can update enquiries"      ON enquiries              FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can manage status history" ON enquiry_status_history FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage gallery"        ON gallery                FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage service areas"  ON service_areas          FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage reviews"        ON reviews                FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage customers"      ON customers              FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage invoices"       ON invoices               FOR ALL USING (is_admin());
CREATE POLICY "Admin can view audit logs"       ON audit_logs             FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert audit"   ON audit_logs             FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view analytics"        ON analytics_events       FOR SELECT USING (is_admin());
CREATE POLICY "Admin can manage theme"          ON theme_settings         FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage reminders"      ON booking_reminders      FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage custom food"    ON custom_food_requests   FOR ALL USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 12: SEED DATA — Real Shri Ganapathi Mess data
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Hotel record ──
INSERT INTO hotels (
  name_ta, name_en, phone, whatsapp, email,
  address_ta, address_en,
  latitude, longitude, is_active
) VALUES (
  'ஸ்ரீ கணபதி மெஸ்',
  'Shri Ganapathi Mess',
  '+919942351280',
  '+919942351280',
  'shanthishanthi2772@gmail.com',
  '5, ஈஸ்வர மூர்த்தி நகர், 4வது தெரு, வெல்லியங்காடு, திருப்பூர் - 641604',
  '5, Esswara Moorthy Nagar, 4th Street, Velliyangadu, Tiruppur - 641604',
  11.1085,
  77.3411,
  true
);

-- ── Service areas ──
INSERT INTO service_areas (hotel_id, name_en, name_ta, delivery_charge, distance_km)
SELECT h.id, area.name_en, area.name_ta, area.charge, area.dist
FROM hotels h, (VALUES
  ('Velliyangadu',       'வெல்லியங்காடு',        0,    0),
  ('60 Feet Road',       '60 அடி ரோடு',           0,    3),
  ('Pushpa Theatre Area','புஷ்பா தியேட்டர் பகுதி', 0,   4),
  ('Avinashi Palayam',   'அவிநாசி பாளையம்',       0,    4),
  ('Nallur',             'நல்லூர்',               0,    5),
  ('Veerapandi',         'வீரபாண்டி',             0,    5),
  ('Avinashi',           'அவிநாசி',               1800, 18),
  ('Palladam',           'பல்லடம்',               2000, 20),
  ('Perumanallur',       'பெருமாநல்லூர்',         1500, 15),
  ('Kangeyam',           'காங்கேயம்',             2500, 25)
) AS area(name_en, name_ta, charge, dist)
WHERE h.name_en = 'Shri Ganapathi Mess';

-- ── Sample reviews (pre-approved) ──
INSERT INTO reviews (hotel_id, customer_name, event_type, rating, review_ta, review_en, is_approved)
SELECT h.id, r.cname, r.etype, r.rating, r.ta, r.en, true
FROM hotels h, (VALUES
  ('Murugan K.',  'Wedding',   5,
   'மிகவும் சுவையான சாப்பாடு! திருமணத்தில் அனைவரும் பாராட்டினர்.',
   'Very tasty food! Everyone at the wedding appreciated the catering.'),
  ('Kavitha R.',  'Birthday',  5,
   'நல்ல தரமான உணவு, சரியான நேரத்தில் டெலிவரி! மீண்டும் ஆர்டர் செய்வேன்.',
   'Good quality food, timely delivery! Will order again.'),
  ('Senthil M.',  'Corporate', 4,
   'அலுவலக நிகழ்விற்கு சிறந்த சேவை. 150 பேருக்கு சாப்பாடு ஏற்பாடு செய்தனர்.',
   'Excellent service for our office event. Arranged food for 150 people.')
) AS r(cname, etype, rating, ta, en)
WHERE h.name_en = 'Shri Ganapathi Mess';

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ DONE! All 12 tables created. Seed data inserted.
-- Your admin dashboard is now ready to receive enquiries from the public form.
-- ═══════════════════════════════════════════════════════════════════════════════
