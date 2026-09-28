-- 002_menus.sql
-- Menu packages and items

CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ta TEXT,
  description_en TEXT,
  food_type TEXT DEFAULT 'veg', -- veg, nonveg, both
  meal_type TEXT, -- breakfast, lunch, dinner, snacks, special
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

-- Menu items (dishes within a menu)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  name_ta TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ta TEXT,
  description_en TEXT,
  category TEXT, -- breakfast, lunch, dinner, snacks, special
  food_type TEXT DEFAULT 'veg', -- veg, nonveg, egg
  image_url TEXT,
  is_signature BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menus_hotel_id ON menus(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menus_meal_type ON menus(meal_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
