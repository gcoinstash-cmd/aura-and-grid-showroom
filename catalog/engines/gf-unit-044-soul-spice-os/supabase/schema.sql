-- SOUL & SPICE OS — Supabase Schema | Ghost Factory™
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS catering_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  event_type TEXT,
  guest_count INTEGER,
  event_date TIMESTAMP WITH TIME ZONE,
  menu_selections JSONB,
  total_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in-service','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE catering_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert orders" ON catering_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read orders" ON catering_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update orders" ON catering_orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price_per_person NUMERIC(10,2),
  description TEXT,
  is_signature BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu" ON menu_items FOR SELECT USING (is_available = true);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id TEXT UNIQUE NOT NULL,
  party_name TEXT NOT NULL,
  party_email TEXT NOT NULL,
  party_size INTEGER,
  reservation_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read reservations" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
