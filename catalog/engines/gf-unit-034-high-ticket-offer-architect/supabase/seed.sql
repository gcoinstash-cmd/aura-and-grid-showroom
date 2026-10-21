-- High-Ticket Offer Architect Studio Seed Data
INSERT INTO public.offer_blueprints (name, tier, price, delivery_weeks, status, description)
VALUES 
  ('Sovereign Growth Engine', 'Flagship Tier', 25000, 12, 'active', 'End-to-end proprietary enterprise acquisition infrastructure with automated qualified pipeline routing.'),
  ('Institutional Syndicate Vault', 'Syndicate Tier', 15000, 8, 'active', 'Private allocation portal and private placement memorandum presentation terminal.'),
  ('Apex Brand Foundry', 'Sprint Tier', 8500, 4, 'active', 'Obsidian brand identity, high-conversion presentation deck, and sales enablement assets.');

INSERT INTO public.client_roster (client_name, company, offer_blueprint, contract_value, payment_status, onboarding_stage)
VALUES 
  ('Alistair Sterling', 'Sterling Capital Partners', 'Sovereign Growth Engine', 25000, 'paid_full', 'architecture_sprint'),
  ('Elena Vance', 'Vance & Co Atelier', 'Apex Brand Foundry', 8500, 'deposit_cleared', 'intake_audit'),
  ('Marcus Drake', 'Drake Defense Logistics', 'Institutional Syndicate Vault', 15000, 'paid_full', 'final_delivery');

INSERT INTO public.strategy_intakes (client_name, email, annual_revenue, current_bottleneck, target_acv, status)
VALUES 
  ('Julian Croft', 'j.croft@croftaerospace.com', '$5M - $10M', 'Offer commoditization and manual proposal assembly', '$100k+', 'review_pending'),
  ('Seraphina Thorne', 'thorne@thorneluxury.com', '$2M - $5M', 'Client onboarding friction and lack of institutional positioning', '$50k+', 'approved');
