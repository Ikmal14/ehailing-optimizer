-- Migration 006: 3 new zones (Gombak/Batu Caves, Kajang/Bangi, Klang) + more POIs.
BEGIN;

INSERT INTO zones (name, lat, lng, base_speed_kmh, demand_weight) VALUES
('Gombak / Batu Caves', 3.2430, 101.7100, 45, 0.90),
('Kajang / Bangi',      2.9700, 101.7850, 50, 0.95),
('Klang',               3.0280, 101.4510, 50, 0.95)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pois (zone_id, name, category, lat, lng) VALUES
-- Kuala Lumpur City Centre
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'SOGO Kuala Lumpur',          'mall',       3.1557, 101.6946),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Masjid Jamek LRT Interchange','transit',    3.1495, 101.6964),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Menara CIMB (Jalan Raja Laut)','office',    3.1575, 101.6940),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Quill City Mall',            'mall',       3.1598, 101.6991),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Kampung Baru Food Street',   'market',     3.1633, 101.7032),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Chow Kit Monorail Station',  'transit',    3.1642, 101.6983),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Bank Negara Malaysia (BNM)', 'government',  3.1519, 101.6924),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Bukit Nanas Monorail',       'transit',    3.1573, 101.7018),
-- Bukit Bintang / TRX
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Berjaya Times Square',       'mall',    3.1425, 101.7101),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Imbi Monorail Station',      'transit', 3.1428, 101.7105),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Plaza Low Yat',              'mall',    3.1440, 101.7107),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Pudu LRT Station',           'transit', 3.1347, 101.7126),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'ICC Pudu (Breakfast Hub)',   'market',  3.1362, 101.7144),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Kenanga Wholesale City (KWC)','mall',   3.1361, 101.7088),
-- KL Sentral / Bangsar
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Brickfields (Little India)',     'market',      3.1292, 101.6840),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Menara Shell',                   'office',      3.1325, 101.6851),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Bangsar South City Residences',  'residential', 3.1118, 101.6653),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Suasana Sentral Condominium',    'residential', 3.1321, 101.6835),
-- Mid Valley / Bangsar South
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Eco City KTM/LRT',                  'transit',     3.1173, 101.6738),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Mercu 2 & 3 Towers',                'office',      3.1177, 101.6743),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'KL Gateway-Universiti Residential', 'residential', 3.1132, 101.6631),
-- Petaling Jaya
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'PJ New Town (State)',           'office',   3.1001, 101.6465),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Taman Paramount LRT',           'transit',  3.1047, 101.6225),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'SS2 Durian Street / Food Court','market',   3.1174, 101.6228),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Assunta Hospital',              'hospital', 3.0945, 101.6444),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Beacon Hospital',               'hospital', 3.0950, 101.6481),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Asia Jaya LRT Station',         'transit',  3.1039, 101.6378),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Section 14 Commercial Hub',     'mall',     3.1105, 101.6358),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Jaya One',                      'mall',     3.1178, 101.6355),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'PJ Hilton Hotel',              'hotel',    3.1022, 101.6401),
-- Damansara / Mutiara
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Strand Mall Kota Damansara', 'mall',        3.1554, 101.5947),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Kota Damansara MRT',         'transit',     3.1511, 101.5794),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Sunway Giza Mall',           'nightlife',   3.1512, 101.5912),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'KPJ Damansara 2 (Trilogy)',  'hospital',    3.1633, 101.6315),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Perdana Exclusive Condo',    'residential', 3.1648, 101.6052),
-- Subang Jaya / Sunway
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'SS15 Boba Street / Commercial','nightlife',  3.0765, 101.5891),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Main Place Mall USJ 21',       'mall',       3.0258, 101.5815),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'USJ 21 LRT Station',           'transit',    3.0254, 101.5824),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Sunway Geo Avenue',            'office',     3.0642, 101.6094),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Segi College Subang Jaya',     'university', 3.0594, 101.5905),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Taipan USJ 10 Commercial',     'office',     3.0483, 101.5857),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Taipan LRT Station',           'transit',    3.0474, 101.5886),
-- Shah Alam
((SELECT id FROM zones WHERE name='Shah Alam'), 'Masjid Negeri Shah Alam',          'tourist',    3.0788, 101.5206),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Plaza Alam Sentral',               'mall',       3.0728, 101.5164),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Management & Science Uni (MSU)',    'university', 3.0772, 101.5511),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Section 7 Commercial (Student Hub)','market',     3.0664, 101.4921),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Batu Tiga KTM Station',            'transit',    3.0825, 101.5543),
((SELECT id FROM zones WHERE name='Shah Alam'), 'KPJ Selangor Specialist',          'hospital',   3.0528, 101.5332),
-- Puchong
((SELECT id FROM zones WHERE name='Puchong'), 'Bandar Puteri LRT Station',     'transit',     3.0173, 101.6178),
((SELECT id FROM zones WHERE name='Puchong'), 'Lotus''s Puchong',              'mall',        3.0416, 101.6166),
((SELECT id FROM zones WHERE name='Puchong'), 'Puchong Utama Residential Grid','residential', 2.9972, 101.6144),
((SELECT id FROM zones WHERE name='Puchong'), 'IOI Boulevard',                 'office',      3.0461, 101.6210),
-- Cheras
((SELECT id FROM zones WHERE name='Cheras'), 'Leisure Mall MRT (Taman Segar)','transit',     3.0898, 101.7431),
((SELECT id FROM zones WHERE name='Cheras'), 'Cheras Flat / Taman Maluri',    'residential', 3.1252, 101.7288),
((SELECT id FROM zones WHERE name='Cheras'), 'Pantai Hospital Cheras',        'hospital',    3.1026, 101.7423),
((SELECT id FROM zones WHERE name='Cheras'), 'UCSI North Campus',             'university',  3.0838, 101.7315),
((SELECT id FROM zones WHERE name='Cheras'), 'Aeon Taman Maluri',             'mall',        3.1213, 101.7289),
-- Bukit Jalil / Sri Petaling
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Endah Parade',           'mall',        3.0645, 101.6966),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Sri Petaling LRT Station','transit',     3.0614, 101.6965),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'IMU University (Medical)','university',  3.0589, 101.6853),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Bukit Jalil Golf Resort', 'residential', 3.0544, 101.6789),
-- Putrajaya / Cyberjaya
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Tamarind Square Cyberjaya',  'nightlife',  2.9318, 101.6362),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Shaftsbury Square Cyberjaya','office',     2.9238, 101.6621),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Alamanda Putrajaya Shopping','mall',       2.9428, 101.7122),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Cyberjaya Utara MRT',        'transit',    2.9515, 101.6601),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Perdana University',         'university', 2.9262, 101.6521),
-- Setapak / Wangsa Maju
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'Aeon Big Wangsa Maju',     'mall',        3.2001, 101.7454),
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'Sri Rampai LRT Station',   'transit',     3.1989, 101.7408),
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'PV12 / PV13 Condominiums', 'residential', 3.2062, 101.7199),
-- Gombak / Batu Caves
((SELECT id FROM zones WHERE name='Gombak / Batu Caves'), 'Batu Caves Temple Grounds',       'tourist',    3.2374, 101.6838),
((SELECT id FROM zones WHERE name='Gombak / Batu Caves'), 'International Islamic Uni (UIAM)', 'university', 3.2514, 101.7358),
((SELECT id FROM zones WHERE name='Gombak / Batu Caves'), 'Gombak LRT Terminus',             'transit',    3.2431, 101.7403),
-- Kajang / Bangi
((SELECT id FROM zones WHERE name='Kajang / Bangi'), 'Metro Point Complex Kajang',    'mall',       2.9935, 101.7912),
((SELECT id FROM zones WHERE name='Kajang / Bangi'), 'Kajang MRT/KTM Interchange',    'transit',    2.9774, 101.7904),
((SELECT id FROM zones WHERE name='Kajang / Bangi'), 'Universiti Kebangsaan Malaysia','university', 2.9289, 101.7801),
((SELECT id FROM zones WHERE name='Kajang / Bangi'), 'Hospital Kajang',               'hospital',   2.9938, 101.7951),
((SELECT id FROM zones WHERE name='Kajang / Bangi'), 'Bangi Gateway Shopping Complex','mall',       2.9282, 101.7654),
-- Klang
((SELECT id FROM zones WHERE name='Klang'), 'Aeon Mall Bukit Tinggi Klang',     'mall',     3.0012, 101.4443),
((SELECT id FROM zones WHERE name='Klang'), 'Hospital Tengku Ampuan Rahimah',   'hospital', 3.0205, 101.4438),
((SELECT id FROM zones WHERE name='Klang'), 'Klang KTM Station',                'transit',  3.0427, 101.4485),
((SELECT id FROM zones WHERE name='Klang'), 'Centro Mall Klang',                'office',   3.0489, 101.4682);

COMMIT;
