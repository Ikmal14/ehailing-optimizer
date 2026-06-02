-- Migration 003: add more POIs, including new categories.
INSERT INTO pois (zone_id, name, category, lat, lng) VALUES
-- KLCC: nightlife, hotels, government, market
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Changkat Bukit Bintang',   'nightlife',  3.1465, 101.7090),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Pavilion KL',              'mall',       3.1488, 101.7137),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Bukit Bintang MRT',        'transit',    3.1466, 101.7110),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Grand Hyatt KL',           'hotel',      3.1530, 101.7130),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Dewan Bandaraya KL',       'government', 3.1530, 101.6960),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Chow Kit Market',          'market',     3.1632, 101.6980),
-- PJ: school, stadium, market
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Stadium Petaling Jaya',      'stadium',    3.1060, 101.6440),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'SS2 Wet Market',             'market',     3.1175, 101.6240),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Taylors College PJ',         'school',     3.1280, 101.6360),
-- Subang: airport, hotel
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Subang Skypark Terminal',   'airport',    3.1306, 101.5470),
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Sunway Resort Hotel',       'hotel',      3.0710, 101.6070),
-- Shah Alam: stadium, government, market
((SELECT id FROM zones WHERE name='Shah Alam'), 'Stadium Shah Alam',         'stadium',    3.0710, 101.5160),
((SELECT id FROM zones WHERE name='Shah Alam'), 'SUK Selangor',              'government', 3.0760, 101.5210),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Pasar Borong Selangor',     'market',     3.0240, 101.5560),
-- Cheras: transit, market
((SELECT id FROM zones WHERE name='Cheras'), 'Taman Mutiara MRT',         'transit',    3.0780, 101.7280),
((SELECT id FROM zones WHERE name='Cheras'), 'Pasar Borong Cheras',       'market',     3.0560, 101.7480),
-- Ampang: nightlife, hotel
((SELECT id FROM zones WHERE name='Ampang'), 'TREC KL Nightlife',         'nightlife',  3.1590, 101.7320),
-- Bangsar: nightlife
((SELECT id FROM zones WHERE name='Bangsar'), 'Bangsar Village',           'mall',       3.1290, 101.6700),
((SELECT id FROM zones WHERE name='Bangsar'), 'Jalan Telawi Bars',         'nightlife',  3.1300, 101.6720),
-- Puchong: school
((SELECT id FROM zones WHERE name='Puchong'), 'Setia Walk Puchong',        'mall',       3.0270, 101.6160)
ON CONFLICT DO NOTHING;
