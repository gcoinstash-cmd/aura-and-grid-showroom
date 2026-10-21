-- HERITAGE & HONEY OS — Supabase Schema | Ghost Factory™
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  party_size INTEGER NOT NULL,
  reservation_date TIMESTAMP WITH TIME ZONE,
  table_preference TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no-show')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  is_signature BOOLEAN DEFAULT false,
  is_seasonal BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu" ON menu_items FOR SELECT USING (is_available = true);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_name TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  visit_date DATE,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read verified" ON testimonials FOR SELECT USING (verified = true);
