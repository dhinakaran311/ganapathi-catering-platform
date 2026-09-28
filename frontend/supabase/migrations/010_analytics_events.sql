-- 010_analytics_events.sql
-- Analytics tracking (Category B - A9, E33)

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL, -- page_view, whatsapp_clicked, quote_started, etc.
  event_data JSONB,
  user_id TEXT, -- anonymous session ID
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  locale TEXT, -- ta, en
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theme settings (Category B - A4)
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

-- Booking reminders (Category B - B17)
CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  reminder_type TEXT, -- '7_days_before', '3_days_before', '1_day_before'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  delivery_method TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom food requests (Category B - D25)
CREATE TABLE IF NOT EXISTS custom_food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INT,
  notes TEXT,
  added_by TEXT DEFAULT 'customer', -- customer, admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON theme_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_scheduled_for ON booking_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_status ON booking_reminders(status);
CREATE INDEX IF NOT EXISTS idx_custom_food_requests_enquiry_id ON custom_food_requests(enquiry_id);
