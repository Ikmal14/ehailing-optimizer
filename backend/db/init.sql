-- ENUMs
CREATE TYPE poi_category AS ENUM (
  'transit', 'mall', 'office', 'hospital',
  'university', 'residential', 'park', 'tourist'
);

CREATE TYPE day_type AS ENUM ('weekday', 'weekend');

-- Zones
CREATE TABLE IF NOT EXISTS zones (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE,
  lat            NUMERIC(10,7) NOT NULL,
  lng            NUMERIC(10,7) NOT NULL,
  base_speed_kmh NUMERIC(5,2) NOT NULL DEFAULT 40.0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Points of interest
CREATE TABLE IF NOT EXISTS pois (
  id       SERIAL PRIMARY KEY,
  zone_id  INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name     VARCHAR(150) NOT NULL,
  category poi_category NOT NULL,
  lat      NUMERIC(10,7) NOT NULL,
  lng      NUMERIC(10,7) NOT NULL
);
CREATE INDEX idx_pois_zone_id  ON pois (zone_id);
CREATE INDEX idx_pois_category ON pois (category);

-- Time-block strategy config
CREATE TABLE IF NOT EXISTS strategy_blocks (
  id                SERIAL PRIMARY KEY,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  day_type          day_type NOT NULL,
  target_categories poi_category[] NOT NULL,
  label             VARCHAR(100),
  UNIQUE (start_time, end_time, day_type)
);

-- Driver configuration (single row)
CREATE TABLE IF NOT EXISTS driver_params (
  id                   INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fuel_efficiency      NUMERIC(5,2)  NOT NULL DEFAULT 22.0,
  fuel_price_myr       NUMERIC(5,3)  NOT NULL DEFAULT 2.05,
  base_lat             NUMERIC(10,7) NOT NULL DEFAULT 3.1073,
  base_lng             NUMERIC(10,7) NOT NULL DEFAULT 101.6369,
  min_profit_threshold NUMERIC(6,2)  NOT NULL DEFAULT 5.00,
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
INSERT INTO driver_params DEFAULT VALUES ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: Klang Valley Zones
-- ─────────────────────────────────────────────
INSERT INTO zones (name, lat, lng, base_speed_kmh) VALUES
('Kuala Lumpur City Centre', 3.1500, 101.6975, 35.0),
('Petaling Jaya',            3.1073, 101.6369, 45.0),
('Subang Jaya',              3.0567, 101.5851, 45.0),
('Shah Alam',                3.0850, 101.5320, 50.0),
('Cheras',                   3.0950, 101.7308, 40.0),
('Ampang',                   3.1548, 101.7627, 38.0),
('Mont Kiara',               3.1739, 101.6617, 35.0),
('Bangsar',                  3.1313, 101.6699, 35.0),
('Kepong',                   3.2147, 101.6356, 45.0),
('Puchong',                  3.0126, 101.6213, 48.0)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: POIs
-- ─────────────────────────────────────────────
INSERT INTO pois (zone_id, name, category, lat, lng) VALUES
-- KLCC
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'KLCC LRT Station',       'transit',     3.1579, 101.7118),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Suria KLCC',             'mall',        3.1580, 101.7118),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'KL Sentral',             'transit',     3.1342, 101.6869),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Hospital Kuala Lumpur',  'hospital',    3.1701, 101.6976),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Menara TM',              'office',      3.1408, 101.6906),
-- Petaling Jaya
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Mid Valley Megamall',  'mall',       3.1178, 101.6768),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Sunway Pyramid',       'mall',       3.0733, 101.6063),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Universiti Malaya',    'university', 3.1209, 101.6542),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'PJ Sentral',           'transit',    3.1073, 101.6425),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Damansara Uptown',     'office',     3.1401, 101.6239),
-- Subang Jaya
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Empire Shopping Gallery', 'mall',       3.0553, 101.5855),
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Subang Airport (SZB)',    'transit',    3.1306, 101.5508),
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Taylor University',        'university', 3.0667, 101.5831),
-- Shah Alam
((SELECT id FROM zones WHERE name='Shah Alam'), 'AEON Shah Alam',     'mall',       3.0849, 101.5370),
((SELECT id FROM zones WHERE name='Shah Alam'), 'UiTM Shah Alam',     'university', 3.0726, 101.5201),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Hospital Shah Alam', 'hospital',   3.0894, 101.5174),
-- Cheras
((SELECT id FROM zones WHERE name='Cheras'), 'Leisure Mall Cheras', 'mall',        3.0950, 101.7308),
((SELECT id FROM zones WHERE name='Cheras'), 'Taman Connaught',     'residential', 3.0827, 101.7418),
-- Ampang
((SELECT id FROM zones WHERE name='Ampang'), 'KLPAC',        'tourist', 3.1744, 101.6824),
((SELECT id FROM zones WHERE name='Ampang'), 'Ampang Point', 'mall',    3.1548, 101.7627),
-- Mont Kiara
((SELECT id FROM zones WHERE name='Mont Kiara'), '1 Mont Kiara Mall',      'mall',        3.1739, 101.6617),
((SELECT id FROM zones WHERE name='Mont Kiara'), 'Mont Kiara Expats Cluster','residential',3.1793, 101.6664),
-- Bangsar
((SELECT id FROM zones WHERE name='Bangsar'), 'Bangsar Shopping Centre', 'mall',    3.1313, 101.6699),
((SELECT id FROM zones WHERE name='Bangsar'), 'Bangsar LRT',             'transit', 3.1264, 101.6717),
-- Kepong
((SELECT id FROM zones WHERE name='Kepong'), 'Taman Metropolitan Kepong', 'park', 3.2147, 101.6356),
((SELECT id FROM zones WHERE name='Kepong'), 'Kepong Sentral Mall',       'mall', 3.2106, 101.6280),
-- Puchong
((SELECT id FROM zones WHERE name='Puchong'), 'IOI City Mall',    'mall',        2.9716, 101.7217),
((SELECT id FROM zones WHERE name='Puchong'), 'Puchong Perdana',  'residential', 3.0126, 101.6213)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: Strategy Blocks
-- ─────────────────────────────────────────────
INSERT INTO strategy_blocks (start_time, end_time, day_type, target_categories, label) VALUES
('05:00', '08:00', 'weekday', ARRAY['residential','transit']::poi_category[],    'Early Morning Commuter'),
('08:00', '10:00', 'weekday', ARRAY['hospital','university']::poi_category[],    'Morning Institutions'),
('10:00', '12:00', 'weekday', ARRAY['office','mall']::poi_category[],            'Mid-Morning CBD'),
('12:00', '14:00', 'weekday', ARRAY['office','mall']::poi_category[],            'Lunch Rush'),
('14:00', '16:00', 'weekday', ARRAY['mall','transit']::poi_category[],           'Post-Lunch Drift'),
('16:00', '20:00', 'weekday', ARRAY['office','transit']::poi_category[],         'Evening Peak'),
('20:00', '23:59', 'weekday', ARRAY['mall','tourist','transit']::poi_category[], 'Night Economy'),
('05:00', '12:00', 'weekend', ARRAY['residential','transit']::poi_category[],   'Weekend Morning'),
('12:00', '22:00', 'weekend', ARRAY['mall','park','tourist']::poi_category[],   'Weekend Leisure'),
('22:00', '23:59', 'weekend', ARRAY['mall','transit']::poi_category[],          'Weekend Late Night')
ON CONFLICT (start_time, end_time, day_type) DO NOTHING;
