-- 011_rls_policies.sql
-- Row Level Security policies
-- MUST be run LAST after all tables are created

-- Enable RLS on all tables
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

-- ============================================================
-- PUBLIC POLICIES (No auth required)
-- ============================================================

-- Hotels: anyone can read
CREATE POLICY "Public can view hotels" ON hotels
  FOR SELECT USING (is_active = true);

-- Menus: anyone can read active menus
CREATE POLICY "Public can view menus" ON menus
  FOR SELECT USING (is_active = true);

-- Menu items: anyone can read
CREATE POLICY "Public can view menu items" ON menu_items
  FOR SELECT USING (true);

-- Gallery: anyone can view active photos
CREATE POLICY "Public can view gallery" ON gallery
  FOR SELECT USING (is_active = true);

-- Service areas: anyone can read
CREATE POLICY "Public can view service areas" ON service_areas
  FOR SELECT USING (is_active = true);

-- Reviews: anyone can view approved reviews
CREATE POLICY "Public can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = true);

-- Reviews: anyone can submit a review (goes for approval)
CREATE POLICY "Public can submit reviews" ON reviews
  FOR INSERT WITH CHECK (is_approved = false);

-- Enquiries: anyone can INSERT (WhatsApp-first, but API route can save)
CREATE POLICY "Public can submit enquiries" ON enquiries
  FOR INSERT WITH CHECK (true);

-- Analytics: anyone can insert events
CREATE POLICY "Public can track analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN POLICIES (Authenticated users only)
-- ============================================================

-- Helper: check if user is authenticated admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hotels: admin full access
CREATE POLICY "Admin can manage hotels" ON hotels
  FOR ALL USING (is_admin());

-- Menus: admin full access
CREATE POLICY "Admin can manage menus" ON menus
  FOR ALL USING (is_admin());

-- Menu items: admin full access
CREATE POLICY "Admin can manage menu items" ON menu_items
  FOR ALL USING (is_admin());

-- Enquiries: admin can read ALL
CREATE POLICY "Admin can view all enquiries" ON enquiries
  FOR SELECT USING (is_admin());

-- Enquiries: admin can update
CREATE POLICY "Admin can update enquiries" ON enquiries
  FOR UPDATE USING (is_admin());

-- Status history: admin full access
CREATE POLICY "Admin can manage status history" ON enquiry_status_history
  FOR ALL USING (is_admin());

-- Gallery: admin full access
CREATE POLICY "Admin can manage gallery" ON gallery
  FOR ALL USING (is_admin());

-- Service areas: admin full access
CREATE POLICY "Admin can manage service areas" ON service_areas
  FOR ALL USING (is_admin());

-- Reviews: admin full access (approve/reject)
CREATE POLICY "Admin can manage reviews" ON reviews
  FOR ALL USING (is_admin());

-- Customers: admin full access
CREATE POLICY "Admin can manage customers" ON customers
  FOR ALL USING (is_admin());

-- Invoices: admin full access
CREATE POLICY "Admin can manage invoices" ON invoices
  FOR ALL USING (is_admin());

-- Audit logs: admin can read
CREATE POLICY "Admin can view audit logs" ON audit_logs
  FOR SELECT USING (is_admin());

-- Audit logs: system can insert (via service role)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Analytics: admin can read
CREATE POLICY "Admin can view analytics" ON analytics_events
  FOR SELECT USING (is_admin());

-- Theme settings: admin full access
CREATE POLICY "Admin can manage theme" ON theme_settings
  FOR ALL USING (is_admin());

-- Booking reminders: admin full access
CREATE POLICY "Admin can manage reminders" ON booking_reminders
  FOR ALL USING (is_admin());

-- Custom food requests: admin full access
CREATE POLICY "Admin can manage custom food" ON custom_food_requests
  FOR ALL USING (is_admin());
