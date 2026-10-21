-- HERITAGE & HONEY OS — Seed Data
INSERT INTO menu_items (category, name, description, price, is_signature) VALUES
('Starters', 'Honeycomb Burrata', 'Fresh burrata drizzled with raw wildflower honey, compressed honeydew, and Aleppo pepper.', 22, true),
('Starters', 'Smoked Duck Croquettes', 'Heritage breed duck confit with truffle mustard and pickled golden beet slaw.', 26, false),
('Mains', 'Slow-Roasted Prime Rib', '28-day dry-aged prime rib, horseradish cream, Yorkshire pudding, and au jus.', 68, true),
('Mains', 'Heritage Chicken', 'Free-range bird with thyme butter jus, roasted root vegetables, and black truffle foam.', 48, true),
('Mains', 'Wild Mushroom Risotto', 'Carnaroli rice with chanterelle, oyster, and morel mushrooms, aged Parmigiano.', 38, false),
('Desserts', 'Honey Lavender Panna Cotta', 'House-set panna cotta with raw honeycomb, lavender essence, and macerated berries.', 16, true)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (guest_name, rating, review, verified) VALUES
('Margaret & Thomas Aldridge', 5, 'Heritage & Honey is a true gem. The atmosphere is warm and intimate, and every dish tells a story of provenance and craft.', true),
('Sofia Laurent', 5, 'The slow-roasted prime rib is the finest I have had anywhere. The honey lavender panna cotta is transcendent.', true),
('James Okafor', 5, 'A restaurant that honors its ingredients and its guests equally. Our anniversary dinner was absolutely unforgettable.', true)
ON CONFLICT DO NOTHING;
