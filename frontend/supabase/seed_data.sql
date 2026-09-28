-- seed_data.sql
-- Seed initial data for Shri Ganapathi Mess
-- Run AFTER all migrations (001-011)

-- ============================================================
-- 1. Hotel Record
-- ============================================================
INSERT INTO hotels (
  name_ta, name_en, 
  description_ta, description_en,
  phone, whatsapp, email,
  address_ta, address_en,
  latitude, longitude
) VALUES (
  'ஸ்ரீ கணபதி மெஸ்',
  'Shri Ganapathi Mess',
  'திருப்பூரில் 10+ ஆண்டுகளாக பாரம்பரிய வீட்டு முறை சமையல் ஆர்டர்கள் சிறப்பாக செய்து வருகிறோம்.',
  'Providing traditional home-style catering in Tiruppur for 10+ years. Specializing in bulk orders for 100-500 persons.',
  '+919942351280',
  '+919942351280',
  'shanthishanthi2772@gmail.com',
  '5, ஈஸ்வர மூர்த்தி நகர், 4வது தெரு, வெல்லியங்காடு, திருப்பூர் - 641604',
  '5, Esswara Moorthy Nagar, 4th Street, Velliyangadu, Tiruppur - 641604',
  11.1085,
  77.3411
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Service Areas
-- ============================================================
DO $$
DECLARE hotel_uuid UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name_en = 'Shri Ganapathi Mess' LIMIT 1;
  
  INSERT INTO service_areas (hotel_id, name_ta, name_en, delivery_available, delivery_charge, distance_km) VALUES
    (hotel_uuid, 'வெல்லியங்காடு (தள ஏடு)', 'Velliyangadu (Home Base)', true, 0, 0),
    (hotel_uuid, 'திருப்பூர் நகர்', 'Tiruppur City', true, 0, 5),
    (hotel_uuid, 'அவிநாசி', 'Avinashi', true, 100, 18),
    (hotel_uuid, 'பல்லடம்', 'Palladam', true, 200, 20),
    (hotel_uuid, 'கங்கேயம்', 'Kangeyam', true, 500, 25),
    (hotel_uuid, 'பெருமாநல்லூர்', 'Perumanallur', true, 300, 15),
    (hotel_uuid, 'புஷ்பா தியேட்டர் பகுதி', 'Pushpa Theatre Area', true, 0, 8),
    (hotel_uuid, '60 அடி ரோடு', '60 Feet Road', true, 0, 3),
    (hotel_uuid, '30 கி.மீ வரை', 'Up to 30 km', true, 100, 30);
END $$;

-- ============================================================
-- 3. Menu Items — Full Ganapathi Mess Menu
-- ============================================================
DO $$
DECLARE hotel_uuid UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name_en = 'Shri Ganapathi Mess' LIMIT 1;

  -- BREAKFAST MENU
  INSERT INTO menu_items (menu_id, name_ta, name_en, category, food_type, is_signature, display_order)
  SELECT NULL, item_ta, item_en, 'breakfast', ft, sig, ord
  FROM (VALUES
    ('இட்லி', 'Idly', 'veg', false, 1),
    ('பூரி', 'Poori', 'veg', false, 2),
    ('பொங்கல்', 'Pongal', 'veg', false, 3),
    ('நெய் தோசை', 'Ghee Dosa', 'veg', false, 4),
    ('பூண்டு தோசை', 'Garlic Dosa (Poondu Dosa)', 'veg', false, 5),
    ('வெங்காய உத்தப்பம்', 'Onion Uthappam', 'veg', false, 6),
    ('சாதா உத்தப்பம்', 'Plain Uthappam', 'veg', false, 7),
    ('கோதுமை உப்புமா', 'Wheat Uppuma', 'veg', false, 8),
    ('பருப்பு சாதம்', 'Paruppu Sadham', 'veg', false, 9),
    ('ஆம்லெட்', 'Omelette', 'egg', false, 10),
    ('வேக வைத்த முட்டை', 'Boiled Egg', 'egg', false, 11)
  ) AS t(item_ta, item_en, ft, sig, ord);

  -- LUNCH MENU
  INSERT INTO menu_items (menu_id, name_ta, name_en, category, food_type, is_signature, display_order)
  SELECT NULL, item_ta, item_en, 'lunch', ft, sig, ord
  FROM (VALUES
    ('வெள்ளை அரிசி சாதம்', 'White Rice', 'veg', false, 1),
    ('சாம்பார்', 'Sambar', 'veg', false, 2),
    ('புளி குழம்பு', 'Puli Kolambu', 'veg', false, 3),
    ('ரசம்', 'Rasam', 'veg', false, 4),
    ('பொரியல்', 'Poriyal', 'veg', false, 5),
    ('வடாம்', 'Vadam', 'veg', false, 6),
    ('அப்பளம்', 'Appalam', 'veg', false, 7),
    ('தயிர்', 'Curd', 'veg', false, 8)
  ) AS t(item_ta, item_en, ft, sig, ord);

  -- DINNER MENU
  INSERT INTO menu_items (menu_id, name_ta, name_en, category, food_type, is_signature, display_order)
  SELECT NULL, item_ta, item_en, 'dinner', ft, sig, ord
  FROM (VALUES
    ('இட்லி', 'Idly', 'veg', false, 1),
    ('வெங்காய தோசை', 'Onion Dosa', 'veg', false, 2),
    ('பூண்டு தோசை', 'Garlic Dosa', 'veg', false, 3),
    ('நெய் தோசை', 'Ghee Dosa', 'veg', false, 4),
    ('சப்பாத்தி', 'Chapathi', 'veg', false, 5),
    ('பரோட்டா', 'Parotta', 'veg', false, 6),
    ('வீச்சு பரோட்டா', 'Veechu Parotta', 'veg', false, 7),
    ('ஆம்லெட்', 'Omelette', 'egg', false, 8)
  ) AS t(item_ta, item_en, ft, sig, ord);

  -- SNACKS
  INSERT INTO menu_items (menu_id, name_ta, name_en, category, food_type, is_signature, display_order)
  SELECT NULL, item_ta, item_en, 'snacks', ft, sig, ord
  FROM (VALUES
    ('பஜ்ஜி', 'Bajji', 'veg', false, 1),
    ('போண்டா', 'Bonda', 'veg', false, 2),
    ('வடை', 'Vadai', 'veg', false, 3),
    ('சுண்டல்', 'Sundal', 'veg', false, 4)
  ) AS t(item_ta, item_en, ft, sig, ord);

  -- SPECIAL NON-VEG (Signature Dishes)
  INSERT INTO menu_items (menu_id, name_ta, name_en, category, food_type, is_signature, display_order)
  SELECT NULL, item_ta, item_en, 'special', ft, sig, ord
  FROM (VALUES
    ('நாட்டுக்கோழி குழம்பு', 'Country Chicken Curry', 'nonveg', true, 1),
    ('நாட்டுக்கோழி கிரேவி', 'Country Chicken Gravy', 'nonveg', true, 2),
    ('சிந்தாமணி கிரேவி', 'Chettinad Chicken Gravy', 'nonveg', true, 3)
  ) AS t(item_ta, item_en, ft, sig, ord);

END $$;

-- ============================================================
-- 4. Placeholder Reviews
-- ============================================================
DO $$
DECLARE hotel_uuid UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name_en = 'Shri Ganapathi Mess' LIMIT 1;

  INSERT INTO reviews (hotel_id, customer_name, event_type, rating, review_ta, review_en, is_approved) VALUES
    (hotel_uuid, 'முருகன் K.', 'wedding', 5, 
     'மிகவும் சுவையான சாப்பாடு! திருமணத்தில் 200 பேருக்கு சாப்பாடு சிறப்பாக வழங்கப்பட்டது. அனைவரும் பாராட்டினர்.',
     'Very tasty food! Catering for 200 people at our wedding was excellent. Everyone appreciated the authentic taste.',
     true),
    (hotel_uuid, 'கவிதா R.', 'birthday', 5,
     'நல்ல தரமான உணவு, சரியான நேரத்தில் டெலிவரி! 100 பேருக்கு பிறந்தநாள் விழாவிற்கு மிகவும் சந்தோஷமாக இருந்தது.',
     'Good quality food, timely delivery! Very happy with the catering for our birthday party of 100 people. Will order again.',
     true),
    (hotel_uuid, 'செந்தில் M.', 'corporate', 4,
     'அலுவலக நிகழ்விற்கு சிறந்த சேவை. 150 பேருக்கு சாப்பாடு ஏற்பாடு செய்தனர். நாட்டுக்கோழி குழம்பு மிகவும் சுவையாக இருந்தது!',
     'Excellent service for our office event. Arranged food for 150 people. The Country Chicken Curry was outstanding!',
     true);

END $$;

-- ============================================================
-- 5. Theme Settings (default)
-- ============================================================
DO $$
DECLARE hotel_uuid UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name_en = 'Shri Ganapathi Mess' LIMIT 1;
  
  INSERT INTO theme_settings (hotel_id, primary_color, secondary_color, accent_color)
  VALUES (hotel_uuid, '#1a3d20', '#b8860b', '#25D366')
  ON CONFLICT DO NOTHING;
END $$;
