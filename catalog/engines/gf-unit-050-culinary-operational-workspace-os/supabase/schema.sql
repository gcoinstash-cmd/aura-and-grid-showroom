-- CULINARY OPERATIONAL WORKSPACE OS — Supabase Schema | Ghost Factory™
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS banquet_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE NOT NULL,
  host_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  covers_count INTEGER NOT NULL,
  venue_location TEXT NOT NULL,
  budget_estimate NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('inquiry', 'confirmed', 'mise-en-place', 'prep-ready', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE banquet_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert banquet" ON banquet_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage banquet" ON banquet_bookings FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS culinary_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  cost_per_cover NUMERIC(8,2) NOT NULL,
  selling_price NUMERIC(8,2) NOT NULL,
  prep_station TEXT NOT NULL,
  allergens TEXT[],
  image_url TEXT,
  available BOOLEAN DEFAULT true
);
ALTER TABLE culinary_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dishes" ON culinary_menu_items FOR SELECT USING (available = true);
CREATE POLICY "Admin manage dishes" ON culinary_menu_items FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS dietary_allergen_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_identifier TEXT NOT NULL,
  booking_id TEXT REFERENCES banquet_bookings(booking_id),
  severity TEXT CHECK (severity IN ('ANAPHYLACTIC', 'SEVERE', 'INTOLERANCE', 'LIFESTYLE')),
  allergen_spec TEXT NOT NULL,
  substitute_protocol TEXT,
  chef_signed_off BOOLEAN DEFAULT false
);
ALTER TABLE dietary_allergen_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage dietary" ON dietary_allergen_records FOR ALL USING (auth.role() = 'authenticated');
