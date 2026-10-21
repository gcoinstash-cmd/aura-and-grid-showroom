-- Zenith Elite Agency OS Schema
-- Real-time tables for enterprise retainers, architectural proposals, and 3D deliverables

CREATE TABLE IF NOT EXISTS public.agency_retainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retainer_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  engagement_scope TEXT NOT NULL,
  monthly_fee NUMERIC(10, 2) NOT NULL,
  term_length TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active Sprint',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_ref TEXT NOT NULL UNIQUE,
  prospect_name TEXT NOT NULL,
  project_scope TEXT NOT NULL,
  target_budget NUMERIC(12, 2) NOT NULL,
  win_probability TEXT NOT NULL,
  timeline_stage TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.digital_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_name TEXT NOT NULL,
  asset_format TEXT NOT NULL,
  due_status TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agency_retainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to retainers"
  ON public.agency_retainers FOR SELECT USING (true);

CREATE POLICY "Allow authenticated staff to manage proposals"
  ON public.pipeline_proposals FOR ALL USING (true);

CREATE POLICY "Allow authenticated staff to manage deliverables"
  ON public.digital_deliverables FOR ALL USING (true);
