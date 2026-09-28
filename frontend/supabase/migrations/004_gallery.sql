-- 004_gallery.sql
-- Photo gallery for the hotel

CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  title_ta TEXT,
  title_en TEXT,
  category TEXT, -- food, events, kitchen, hotel, catering
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
