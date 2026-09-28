-- 005_service_areas.sql
-- Delivery service areas

CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT true,
  delivery_charge NUMERIC DEFAULT 0, -- 0 = free
  distance_km NUMERIC, -- approximate distance from base
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_areas_hotel_id ON service_areas(hotel_id);
