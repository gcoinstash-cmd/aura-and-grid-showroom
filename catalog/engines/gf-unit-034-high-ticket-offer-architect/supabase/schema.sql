-- Offer Architect Studio OS Database Schema
-- Row Level Security (RLS) Enabled

CREATE TABLE IF NOT EXISTS offer_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('acquisition', 'retention', 'enterprise', 'automation')),
  productized_price NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
  high_ticket_retainer_price NUMERIC(10, 2) NOT NULL DEFAULT 3500.00,
  target_audience TEXT NOT NULL,
  transformation_statement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_retainer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_company TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  offer_blueprint_id TEXT NOT NULL,
  monthly_retainer NUMERIC(10, 2) NOT NULL DEFAULT 3500.00,
  setup_fee NUMERIC(10, 2) DEFAULT 1500.00,
  contract_status TEXT NOT NULL DEFAULT 'active' CHECK (contract_status IN ('lead', 'negotiating', 'active', 'completed')),
  sla_hours INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE offer_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_retainer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to blueprints"
  ON offer_blueprints FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to contracts"
  ON client_retainer_contracts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to contracts"
  ON client_retainer_contracts FOR INSERT
  WITH CHECK (true);
