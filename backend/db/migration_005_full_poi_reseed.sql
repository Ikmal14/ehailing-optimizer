-- Migration 005: authoritative zone + POI reseed (14 Klang Valley zones, ~120 POIs).
-- Replaces earlier zone/POI seeds. Scoring engine already supports all categories.

BEGIN;

DELETE FROM pois;
DELETE FROM zones;
ALTER SEQUENCE zones_id_seq RESTART WITH 1;
ALTER SEQUENCE pois_id_seq RESTART WITH 1;

-- ── Zones (centroid lat/lng, base speed, demand weight) ──────────────────────
INSERT INTO zones (name, lat, lng, base_speed_kmh, demand_weight) VALUES
('Kuala Lumpur City Centre',     3.1585, 101.7130, 35, 1.40),
('Bukit Bintang / TRX',          3.1450, 101.7140, 33, 1.40),
('KL Sentral / Bangsar',         3.1325, 101.6790, 35, 1.30),
('Mid Valley / Bangsar South',   3.1150, 101.6710, 35, 1.30),
('Petaling Jaya',                3.1290, 101.6190, 45, 1.25),
('Damansara / Mutiara',          3.1530, 101.6080, 45, 1.15),
('Subang Jaya / Sunway',         3.0680, 101.5960, 45, 1.20),
('Shah Alam',                    3.0730, 101.5010, 50, 1.00),
('Puchong',                      3.0330, 101.6170, 48, 0.95),
('Cheras',                       3.1080, 101.7300, 40, 1.05),
('Bukit Jalil / Sri Petaling',   3.0560, 101.6880, 45, 1.05),
('Putrajaya / Cyberjaya',        2.9340, 101.6660, 55, 0.90),
('Setapak / Wangsa Maju',        3.2050, 101.7240, 42, 0.95),
('Ampang',                       3.1565, 101.7490, 38, 1.00);

-- ── POIs ─────────────────────────────────────────────────────────────────────
INSERT INTO pois (zone_id, name, category, lat, lng) VALUES
-- Kuala Lumpur City Centre
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Suria KLCC',              'mall',    3.1578, 101.7119),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'KLCC LRT Station',        'transit', 3.1590, 101.7135),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Petronas Twin Towers',    'tourist', 3.1579, 101.7116),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Saloma Link',             'tourist', 3.1615, 101.7082),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Avenue K',                'mall',    3.1595, 101.7130),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Ampang Park MRT',         'transit', 3.1621, 101.7181),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Menara Maxis',            'office',  3.1580, 101.7121),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'G Tower',                 'office',  3.1593, 101.7195),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'The Intermark',           'mall',    3.1616, 101.7196),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Mandarin Oriental KL',    'hotel',   3.1549, 101.7126),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Traders Hotel KL',        'hotel',   3.1534, 101.7144),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Aquaria KLCC',            'tourist', 3.1539, 101.7131),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Taman Tasik Titiwangsa',  'park',    3.1764, 101.7056),
-- Bukit Bintang / TRX
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Pavilion KL',               'mall',      3.1488, 101.7137),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Bukit Bintang MRT/Monorail','transit',   3.1466, 101.7110),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Lot 10 Shopping Centre',     'mall',      3.1463, 101.7119),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Sungei Wang Plaza',          'mall',      3.1444, 101.7112),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Changkat Bukit Bintang',     'nightlife', 3.1465, 101.7090),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Jalan Alor Food Street',     'market',    3.1458, 101.7086),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'TRX Exchange Mall',          'mall',      3.1420, 101.7190),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Tun Razak Exchange MRT',     'transit',   3.1427, 101.7202),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Menara Exchange 106',        'office',    3.1418, 101.7186),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'TREC KL',                    'nightlife', 3.1408, 101.7212),
((SELECT id FROM zones WHERE name='Bukit Bintang / TRX'), 'Prince Court Medical Centre','hospital',  3.1472, 101.7212),
-- KL Sentral / Bangsar
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'KL Sentral Station',        'transit',   3.1343, 101.6861),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Nu Sentral',                'mall',      3.1332, 101.6868),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Plaza Sentral',             'office',    3.1336, 101.6841),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Menara CIMB',               'office',    3.1357, 101.6866),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'St. Regis KL',              'hotel',     3.1370, 101.6853),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Bank Rakyat Bangsar LRT',   'transit',   3.1275, 101.6782),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Bangsar Village',           'mall',      3.1300, 101.6708),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Bangsar Shopping Centre',   'mall',      3.1426, 101.6675),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Pantai Hospital KL',        'hospital',  3.1205, 101.6672),
((SELECT id FROM zones WHERE name='KL Sentral / Bangsar'), 'Telawi Street',             'nightlife', 3.1317, 101.6711),
-- Mid Valley / Bangsar South
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Mid Valley Megamall',          'mall',    3.1176, 101.6774),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'The Gardens Mall',             'mall',    3.1186, 101.6760),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Mid Valley KTM',               'transit', 3.1179, 101.6782),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Boulevard Offices',            'office',  3.1190, 101.6765),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Universiti LRT Station',       'transit', 3.1143, 101.6616),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'The Vertical Corporate Towers','office',  3.1111, 101.6670),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'Nexus Bangsar South',          'mall',    3.1097, 101.6664),
((SELECT id FROM zones WHERE name='Mid Valley / Bangsar South'), 'KL Gateway Mall',              'mall',    3.1121, 101.6626),
-- Petaling Jaya
((SELECT id FROM zones WHERE name='Petaling Jaya'), '1 Utama Shopping Centre',       'mall',        3.1479, 101.6160),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Bandar Utama MRT',              'transit',     3.1466, 101.6186),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'First Avenue Offices',          'office',      3.1469, 101.6168),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'The Starling Mall',             'mall',        3.1348, 101.6231),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Uptown Damansara Commercial',   'office',      3.1362, 101.6224),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Kelana Jaya LRT',               'transit',     3.1126, 101.5992),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Paradigm Mall',                 'mall',        3.1046, 101.5954),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'University Malaya Medical (PPUM)','hospital',   3.1121, 101.6534),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Universiti Malaya (UM)',        'university',  3.1209, 101.6538),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Seventeen Mall & Residences',   'residential', 3.1235, 101.6348),
-- Damansara / Mutiara
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'IKEA Damansara',           'mall',     3.1572, 101.6115),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'The Curve',                'mall',     3.1579, 101.6114),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Mutiara Damansara MRT',    'transit',  3.1554, 101.6087),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Empire City',              'mall',     3.1672, 101.6148),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'KPJ Damansara Specialist', 'hospital', 3.1367, 101.6288),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Tropicana Gardens Mall',   'mall',     3.1492, 101.5936),
((SELECT id FROM zones WHERE name='Damansara / Mutiara'), 'Surian MRT',               'transit',  3.1498, 101.5941),
-- Subang Jaya / Sunway
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Sunway Pyramid',            'mall',       3.0733, 101.6054),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Sunway Lagoon',             'tourist',    3.0716, 101.6052),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Sunway Medical Centre',     'hospital',   3.0649, 101.6083),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Sunway University',         'university', 3.0673, 101.6035),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Monash University Malaysia','university', 3.0645, 101.6009),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Taylors University Lakeside','university',3.0626, 101.6168),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'INTI International College', 'university', 3.0754, 101.5898),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'SS15 LRT Station',          'transit',    3.0784, 101.5863),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Subang Jaya Medical Centre','hospital',   3.0759, 101.5910),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Empire Shopping Gallery',   'mall',       3.0819, 101.5830),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'USJ 7 LRT/BRT',             'transit',    3.0494, 101.5912),
((SELECT id FROM zones WHERE name='Subang Jaya / Sunway'), 'Da Men Mall',               'mall',       3.0592, 101.5921),
-- Shah Alam
((SELECT id FROM zones WHERE name='Shah Alam'), 'Glenmarie LRT',              'transit',    3.0958, 101.5905),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Shah Alam Hospital',         'hospital',   3.0722, 101.4900),
((SELECT id FROM zones WHERE name='Shah Alam'), 'UiTM Shah Alam',             'university', 3.0683, 101.4990),
((SELECT id FROM zones WHERE name='Shah Alam'), 'I-City Theme Park',          'tourist',    3.0658, 101.4828),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Central i-City Mall',        'mall',       3.0623, 101.4848),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Avisena Specialist Hospital','hospital',   3.0750, 101.5212),
((SELECT id FROM zones WHERE name='Shah Alam'), 'SACC Mall',                  'mall',       3.0723, 101.5186),
-- Puchong
((SELECT id FROM zones WHERE name='Puchong'), 'IOI Mall Puchong',              'mall',      3.0450, 101.6180),
((SELECT id FROM zones WHERE name='Puchong'), 'IOI Puchong Jaya LRT',          'transit',   3.0436, 101.6214),
((SELECT id FROM zones WHERE name='Puchong'), 'Pusat Bandar Puchong LRT',      'transit',   3.0330, 101.6169),
((SELECT id FROM zones WHERE name='Puchong'), 'SetiaWalk',                     'nightlife', 3.0315, 101.6171),
((SELECT id FROM zones WHERE name='Puchong'), 'Columbia Asia Hospital Puchong','hospital',  3.0227, 101.6123),
((SELECT id FROM zones WHERE name='Puchong'), 'PFCC Towers',                   'office',    3.0232, 101.6163),
-- Cheras
((SELECT id FROM zones WHERE name='Cheras'), 'EkoCheras Mall',             'mall',       3.0920, 101.7400),
((SELECT id FROM zones WHERE name='Cheras'), 'Taman Connaught MRT',        'transit',    3.0818, 101.7456),
((SELECT id FROM zones WHERE name='Cheras'), 'UKM Medical Centre (HCTM)',  'hospital',   3.1001, 101.7203),
((SELECT id FROM zones WHERE name='Cheras'), 'Sunway Velocity Mall',       'mall',       3.1265, 101.7252),
((SELECT id FROM zones WHERE name='Cheras'), 'IKEA Cheras',                'mall',       3.1345, 101.7196),
((SELECT id FROM zones WHERE name='Cheras'), 'MyTOWN Shopping Centre',     'mall',       3.1332, 101.7231),
((SELECT id FROM zones WHERE name='Cheras'), 'Cochrane MRT',               'transit',    3.1325, 101.7234),
((SELECT id FROM zones WHERE name='Cheras'), 'UCSI University',            'university', 3.0800, 101.7323),
((SELECT id FROM zones WHERE name='Cheras'), 'Taman Connaught Night Market','market',    3.0831, 101.7371),
-- Bukit Jalil / Sri Petaling
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Bukit Jalil National Stadium','tourist',    3.0543, 101.6917),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Axiata Arena',                'tourist',    3.0540, 101.6888),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Bukit Jalil LRT',             'transit',    3.0583, 101.6872),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Pavilion Bukit Jalil',        'mall',       3.0505, 101.6703),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Asia Pacific University (APU)','university', 3.0565, 101.7003),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Technology Park Malaysia (TPM)','office',    3.0478, 101.6896),
((SELECT id FROM zones WHERE name='Bukit Jalil / Sri Petaling'), 'Sri Petaling Commercial Zone','nightlife',  3.0697, 101.6923),
-- Putrajaya / Cyberjaya
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'IOI City Mall',           'mall',       2.9700, 101.7133),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Putrajaya Sentral',       'transit',    2.9315, 101.6702),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Putrajaya Hospital',      'hospital',   2.9290, 101.6740),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'DPULZE Shopping Centre',  'mall',       2.9220, 101.6510),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Multimedia University (MMU)','university',2.9300, 101.6400),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Cyberjaya Hospital',      'hospital',   2.9304, 101.6288),
((SELECT id FROM zones WHERE name='Putrajaya / Cyberjaya'), 'Kementerian Kewangan (MoF)','government',2.9248, 101.6880),
-- Setapak / Wangsa Maju
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'Setapak Central Mall',          'mall',       3.2045, 101.7180),
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'Wangsa Maju LRT',               'transit',    3.2031, 101.7323),
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'TAR UMT',                       'university', 3.2152, 101.7289),
((SELECT id FROM zones WHERE name='Setapak / Wangsa Maju'), 'Columbia Asia Hospital Setapak','hospital',   3.1979, 101.7169),
-- Ampang
((SELECT id FROM zones WHERE name='Ampang'), 'Gleneagles Hospital KL', 'hospital', 3.1601, 101.7402),
((SELECT id FROM zones WHERE name='Ampang'), 'Ampang Point',           'mall',     3.1581, 101.7516),
((SELECT id FROM zones WHERE name='Ampang'), 'Ampang LRT Station',     'transit',  3.1498, 101.7533),
((SELECT id FROM zones WHERE name='Ampang'), 'KPJ Ampang Puteri',      'hospital', 3.1578, 101.7520);

COMMIT;
