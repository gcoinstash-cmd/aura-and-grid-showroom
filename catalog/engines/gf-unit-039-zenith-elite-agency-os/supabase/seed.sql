-- Zenith Elite Agency OS Mock Data
INSERT INTO public.agency_retainers (retainer_code, client_name, engagement_scope, monthly_fee, term_length, status)
VALUES 
  ('RET-01', 'Aethel Labs', 'Cinematic 3D & Brand Identity', 18500.00, '6 Months', 'Active Sprint'),
  ('RET-02', 'Klausen Autonomous', 'Enterprise Web Experience & Design System', 24000.00, '12 Months', 'Active Sprint'),
  ('RET-03', 'Vance Spatial', 'Spatial Computing Narrative & Motion', 15000.00, 'Quarterly', 'Review Phase');

INSERT INTO public.pipeline_proposals (proposal_ref, prospect_name, project_scope, target_budget, win_probability, timeline_stage)
VALUES 
  ('PRP-901', 'Sovereign Bio', 'Brand Architecture & Global Web Relaunch', 145000.00, '85%', 'Q1 Kickoff'),
  ('PRP-902', 'Orbit Fleet Logistics', 'Design System & Interactive Terminal', 90000.00, '70%', 'Draft Sent'),
  ('PRP-903', 'Helios Media', 'Motion Identity & 3D Web Environment', 120000.00, '90%', 'Verbal Agreement');

INSERT INTO public.digital_deliverables (deliverable_name, asset_format, due_status, owner_role)
VALUES 
  ('Obsidian 3D Asset Vault', 'glTF / USDZ Master Pack', 'In 3 Days', 'Creative Lead'),
  ('WebGL Interaction Prototype', 'React Three Fiber Bundle', 'In 6 Days', 'Technical Director'),
  ('Brand Typography Guidelines', 'PDF Specimen & Web Fonts', 'Delivered', 'Typography Atelier');
