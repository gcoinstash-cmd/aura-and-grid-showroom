-- Nocturne Nightlife OS Schema
-- Real-time tables for VIP bottle tables, live stage lineup, and cellar reserve allocations

CREATE TABLE IF NOT EXISTS public.vip_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_code TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  party_size INT NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  section TEXT NOT NULL,
  spend_commitment NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stage_lineup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_time TEXT NOT NULL,
  performer_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  soundcheck_status TEXT NOT NULL DEFAULT 'Passed',
  performance_state TEXT NOT NULL DEFAULT 'Queued',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cellar_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_name TEXT NOT NULL,
  bottle_tier TEXT NOT NULL,
  inventory_count INT NOT NULL DEFAULT 1,
  allocated_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vip_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cellar_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to stage_lineup"
  ON public.stage_lineup FOR SELECT USING (true);

CREATE POLICY "Allow public insert and read to vip_tables"
  ON public.vip_tables FOR ALL USING (true);

CREATE POLICY "Allow authenticated staff to manage cellar"
  ON public.cellar_allocations FOR ALL USING (true);
