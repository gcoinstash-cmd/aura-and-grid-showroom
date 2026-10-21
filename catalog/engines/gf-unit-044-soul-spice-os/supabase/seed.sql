-- SOUL & SPICE OS — Seed Data
INSERT INTO menu_items (category, name, price_per_person, description, is_signature) VALUES
('Signature Entrees', 'Jerk-Spiced Short Rib', 68, 'Slow-braised Jamaican jerk short rib with roasted breadfruit and pickled scotch bonnet slaw.', true),
('Signature Entrees', 'Oxtail Braised with Root Vegetables', 72, 'Heritage oxtail slow-cooked in red wine with garden root vegetables and fresh thyme.', true),
('Signature Entrees', 'Blackened Snapper with Mango Salsa', 62, 'Wild-caught Gulf snapper with house blackening spice, mango salsa, and coconut rice.', true),
('Soul Sides', 'Collard Greens with Smoked Turkey', 18, 'Long-simmered Southern collard greens with smoked turkey neck.', false),
('Soul Sides', 'Cornbread Skillet', 14, 'Cast iron jalapeño-honey cornbread baked fresh daily.', false),
('Soul Sides', 'Mac & Cheese Supreme', 22, 'Five-cheese béchamel mac with toasted breadcrumb crust.', false)
ON CONFLICT DO NOTHING;
