-- CULINARY OPERATIONAL WORKSPACE OS — Seed Data
INSERT INTO culinary_menu_items (dish_code, name, course, cost_per_cover, selling_price, prep_station, allergens, image_url) VALUES
('DISH-01', 'Perigord Truffle Brioche with Cultured Sea-Salt Butter', 'Amuse-Bouche', 14.50, 48.00, 'Pastry Lab', ARRAY['Gluten', 'Dairy'], 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'),
('DISH-02', 'Hamachi Crudo with Yuzu Kosho, Finger Lime & Shiso', 'First Course', 18.00, 56.00, 'Garde Manger', ARRAY['Fin Fish'], 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'),
('DISH-03', 'Dry-Aged Wagyu Striploin with Bone Marrow Emulsion & Pomme Souffle', 'Entree Main', 38.00, 110.00, 'Rotisserie & Hearth', ARRAY['Dairy'], 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (dish_code) DO NOTHING;

INSERT INTO banquet_bookings (booking_id, host_name, event_type, event_date, covers_count, venue_location, budget_estimate, status) VALUES
('EVT-7701', 'Ambassador De la Tour', 'Private Sovereign Banquet', NOW() + INTERVAL '1 day', 24, 'Chateau Grand Salon', 8400.00, 'mise-en-place'),
('EVT-7702', 'Lady Genevieve Sterling', '12-Course Truffle Degustation', NOW() + INTERVAL '2 days', 8, 'The Library Dining Room', 4200.00, 'prep-ready'),
('EVT-7703', 'Vanguard Global Partners', 'Executive Cellar Dinner', NOW() + INTERVAL '4 days', 16, 'Reserve Wine Vault', 6800.00, 'confirmed')
ON CONFLICT (booking_id) DO NOTHING;
