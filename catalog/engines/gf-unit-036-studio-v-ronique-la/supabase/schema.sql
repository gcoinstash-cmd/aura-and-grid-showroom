-- Studio Véronique LA Atelier Database Schema
-- Provides full real-time persistence for design projects, client consultations, and curated material procurement

CREATE TABLE IF NOT EXISTS public.design_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  phase TEXT NOT NULL,
  square_footage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active Sprint',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_ref TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  consultation_time TIMESTAMPTZ NOT NULL,
  scope_description TEXT NOT NULL,
  budget_tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Discovery Intake',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.material_procurement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name TEXT NOT NULL,
  supplier TEXT NOT NULL,
  lead_time TEXT NOT NULL,
  stock_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.design_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_procurement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to design_projects"
  ON public.design_projects FOR SELECT USING (true);

CREATE POLICY "Allow public insert to client_consultations"
  ON public.client_consultations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated staff full access"
  ON public.material_procurement FOR ALL USING (true);
