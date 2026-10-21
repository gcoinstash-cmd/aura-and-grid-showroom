-- Nocturne Nightlife OS Mock Data
INSERT INTO public.vip_tables (table_code, guest_name, party_size, arrival_time, section, spend_commitment, status)
VALUES 
  ('TBL-VIP1', 'Julian Mercer', 6, NOW() + INTERVAL '3 hours', 'Balcony Mezzanine', 1200.00, 'Confirmed'),
  ('TBL-VIP2', 'Dr. Alexis Vance', 4, NOW() + INTERVAL '4 hours', 'Stage Front Booth', 800.00, 'VIP Seated'),
  ('TBL-VIP3', 'Derrick Holloway', 8, NOW() + INTERVAL '5 hours', 'Green Room Alcove', 1800.00, 'Confirmed');

INSERT INTO public.stage_lineup (set_time, performer_name, genre, soundcheck_status, performance_state)
VALUES 
  ('8:00 PM', 'The Marcus King Quartet', 'Post-Bop & Modal Jazz', 'Passed', 'On Stage'),
  ('10:30 PM', 'Seraphina & The High Council', 'Afro-Cuban Brass & Soul', 'Passed', 'Backstage Ready'),
  ('12:30 AM', 'House Trio + Special Guests', 'Improv Midnight Session', 'Passed', 'Queued');

INSERT INTO public.cellar_allocations (bottle_name, bottle_tier, inventory_count, allocated_to)
VALUES 
  ('Krug Clos d''Ambonnay Champagne', 'Ultra Reserve', 4, 'Held for Table VIP1'),
  ('Pappy Van Winkle 15yr Bourbon', 'Private Stash', 2, 'Held for Table VIP3'),
  ('Clase Azul Reposado Tequila', 'High Volume VIP', 9, 'Main Bottle Bar');
