-- Studio Véronique LA Atelier Seed Data
INSERT INTO public.design_projects (project_code, client_name, project_name, budget, phase, square_footage, status)
VALUES 
  ('PRJ-108', 'Harrison & Claire Sterling', 'Brentwood Modern Zen Residence', 420000.00, 'Schematic Design & Material Board', '6,400 sq ft', 'Active Sprint'),
  ('PRJ-109', 'Klaus Lindner', 'Bel-Air Pavilion & Tea House', 280000.00, 'Custom Millwork Sourcing', '3,800 sq ft', 'Fabrication'),
  ('PRJ-110', 'Seraphina Vance', 'Malibu Cliffside Sanctuary', 650000.00, 'Final Architectural Review', '8,200 sq ft', 'Contract Signed');

INSERT INTO public.client_consultations (consultation_ref, client_name, location, consultation_time, scope_description, budget_tier, status)
VALUES 
  ('CNS-501', 'Julian Drake', 'Pacific Palisades', NOW() + INTERVAL '2 days', 'Full Home Architecture & Interior Redesign', '$300k - $500k', 'VIP Confirmed'),
  ('CNS-502', 'Maya Chen', 'Hollywood Hills', NOW() + INTERVAL '4 days', 'Master Suite & Zen Courtyard Conversion', '$150k - $250k', 'Discovery Intake'),
  ('CNS-503', 'Amos & Leigh Thorne', 'Montecito Estate', NOW() + INTERVAL '6 days', 'Bespoke California Warm Modern Build', '$750k+', 'VIP Confirmed');

INSERT INTO public.material_procurement (material_name, supplier, lead_time, stock_status)
VALUES 
  ('Kyoto Hinoki Cypress Millwork', 'Mori Atelier Japan', '8 weeks', 'Reserved (400 board ft)'),
  ('Roman Travertine Unfilled Slabs', 'Tivoli Stone Quarry', '6 weeks', 'En Route (8 slabs)'),
  ('Raw Belgian Linen Upholstery', 'Libeco Lagae', '3 weeks', 'In Studio (120 yds)');
