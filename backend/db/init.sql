-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ENUMs
CREATE TYPE poi_category AS ENUM (
  'transit', 'mall', 'office', 'hospital',
  'university', 'residential', 'park', 'tourist'
);

CREATE TYPE day_type AS ENUM ('weekday', 'weekend');

-- Zones: Klang Valley coverage polygons
CREATE TABLE IF NOT EXISTS zones (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE,
  geom           GEOMETRY(Polygon, 4326) NOT NULL,
  base_speed_kmh NUMERIC(5,2) NOT NULL DEFAULT 40.0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_zones_geom ON zones USING GIST (geom);

-- Points of interest
CREATE TABLE IF NOT EXISTS pois (
  id       SERIAL PRIMARY KEY,
  zone_id  INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name     VARCHAR(150) NOT NULL,
  category poi_category NOT NULL,
  geom     GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX idx_pois_geom    ON pois USING GIST (geom);
CREATE INDEX idx_pois_zone_id ON pois (zone_id);
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
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fuel_efficiency  NUMERIC(5,2) NOT NULL DEFAULT 22.0, -- km/l
  fuel_price_myr   NUMERIC(5,3) NOT NULL DEFAULT 2.05, -- RON95
  base_lat         NUMERIC(10,7) NOT NULL DEFAULT 3.1073,
  base_lng         NUMERIC(10,7) NOT NULL DEFAULT 101.6369,
  min_profit_threshold NUMERIC(6,2) NOT NULL DEFAULT 5.00, -- MYR after fuel
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO driver_params DEFAULT VALUES ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: Klang Valley Zones (approximate polygons)
-- ─────────────────────────────────────────────
INSERT INTO zones (name, base_speed_kmh, geom) VALUES
('Kuala Lumpur City Centre', 35.0,
  ST_GeomFromText('POLYGON((101.680 3.143, 101.715 3.143, 101.715 3.158, 101.680 3.158, 101.680 3.143))', 4326)),
('Petaling Jaya', 45.0,
  ST_GeomFromText('POLYGON((101.600 3.085, 101.660 3.085, 101.660 3.130, 101.600 3.130, 101.600 3.085))', 4326)),
('Subang Jaya', 45.0,
  ST_GeomFromText('POLYGON((101.570 3.045, 101.630 3.045, 101.630 3.090, 101.570 3.090, 101.570 3.045))', 4326)),
('Shah Alam', 50.0,
  ST_GeomFromText('POLYGON((101.490 3.060, 101.570 3.060, 101.570 3.110, 101.490 3.110, 101.490 3.060))', 4326)),
('Cheras', 40.0,
  ST_GeomFromText('POLYGON((101.720 3.065, 101.770 3.065, 101.770 3.115, 101.720 3.115, 101.720 3.065))', 4326)),
('Ampang', 38.0,
  ST_GeomFromText('POLYGON((101.740 3.140, 101.790 3.140, 101.790 3.175, 101.740 3.175, 101.740 3.140))', 4326)),
('Mont Kiara', 35.0,
  ST_GeomFromText('POLYGON((101.655 3.165, 101.685 3.165, 101.685 3.190, 101.655 3.190, 101.655 3.165))', 4326)),
('Bangsar', 35.0,
  ST_GeomFromText('POLYGON((101.665 3.120, 101.700 3.120, 101.700 3.148, 101.665 3.148, 101.665 3.120))', 4326)),
('Kepong', 45.0,
  ST_GeomFromText('POLYGON((101.620 3.200, 101.665 3.200, 101.665 3.240, 101.620 3.240, 101.620 3.200))', 4326)),
('Puchong', 48.0,
  ST_GeomFromText('POLYGON((101.600 2.990, 101.660 2.990, 101.660 3.040, 101.600 3.040, 101.600 2.990))', 4326))
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: POIs
-- ─────────────────────────────────────────────
INSERT INTO pois (zone_id, name, category, geom) VALUES
-- KLCC
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'KLCC LRT Station',           'transit',     ST_GeomFromText('POINT(101.7118 3.1579)', 4326)),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Suria KLCC',                  'mall',        ST_GeomFromText('POINT(101.7118 3.1580)', 4326)),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'KL Sentral',                  'transit',     ST_GeomFromText('POINT(101.6869 3.1342)', 4326)),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Hospital Kuala Lumpur',        'hospital',    ST_GeomFromText('POINT(101.6976 3.1701)', 4326)),
((SELECT id FROM zones WHERE name='Kuala Lumpur City Centre'), 'Menara TM',                   'office',      ST_GeomFromText('POINT(101.6906 3.1408)', 4326)),
-- Petaling Jaya
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Mid Valley Megamall',               'mall',        ST_GeomFromText('POINT(101.6768 3.1178)', 4326)),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Sunway Pyramid',                    'mall',        ST_GeomFromText('POINT(101.6063 3.0733)', 4326)),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Universiti Malaya',                 'university',  ST_GeomFromText('POINT(101.6542 3.1209)', 4326)),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'PJ Sentral',                        'transit',     ST_GeomFromText('POINT(101.6425 3.1073)', 4326)),
((SELECT id FROM zones WHERE name='Petaling Jaya'), 'Damansara Uptown',                  'office',      ST_GeomFromText('POINT(101.6239 3.1401)', 4326)),
-- Subang Jaya
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Empire Shopping Gallery',           'mall',        ST_GeomFromText('POINT(101.5855 3.0553)', 4326)),
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Subang Airport (SZB)',              'transit',     ST_GeomFromText('POINT(101.5508 3.1306)', 4326)),
((SELECT id FROM zones WHERE name='Subang Jaya'), 'Taylor University',                 'university',  ST_GeomFromText('POINT(101.5831 3.0667)', 4326)),
-- Shah Alam
((SELECT id FROM zones WHERE name='Shah Alam'), 'AEON Shah Alam',                    'mall',        ST_GeomFromText('POINT(101.5370 3.0849)', 4326)),
((SELECT id FROM zones WHERE name='Shah Alam'), 'UiTM Shah Alam',                    'university',  ST_GeomFromText('POINT(101.5201 3.0726)', 4326)),
((SELECT id FROM zones WHERE name='Shah Alam'), 'Hospital Shah Alam',                'hospital',    ST_GeomFromText('POINT(101.5174 3.0894)', 4326)),
-- Cheras
((SELECT id FROM zones WHERE name='Cheras'), 'Leisure Mall Cheras',               'mall',        ST_GeomFromText('POINT(101.7308 3.0950)', 4326)),
((SELECT id FROM zones WHERE name='Cheras'), 'Taman Connaught',                   'residential', ST_GeomFromText('POINT(101.7418 3.0827)', 4326)),
-- Ampang
((SELECT id FROM zones WHERE name='Ampang'), 'KLPAC',                             'tourist',     ST_GeomFromText('POINT(101.6824 3.1744)', 4326)),
((SELECT id FROM zones WHERE name='Ampang'), 'Ampang Point',                      'mall',        ST_GeomFromText('POINT(101.7627 3.1548)', 4326)),
-- Mont Kiara
((SELECT id FROM zones WHERE name='Mont Kiara'), '1 Mont Kiara Mall',             'mall',        ST_GeomFromText('POINT(101.6617 3.1739)', 4326)),
((SELECT id FROM zones WHERE name='Mont Kiara'), 'Mont Kiara Expats Cluster',      'residential', ST_GeomFromText('POINT(101.6664 3.1793)', 4326)),
-- Bangsar
((SELECT id FROM zones WHERE name='Bangsar'), 'Bangsar Shopping Centre',          'mall',        ST_GeomFromText('POINT(101.6699 3.1313)', 4326)),
((SELECT id FROM zones WHERE name='Bangsar'), 'Bangsar LRT',                      'transit',     ST_GeomFromText('POINT(101.6717 3.1264)', 4326)),
-- Kepong
((SELECT id FROM zones WHERE name='Kepong'), 'Taman Metropolitan Kepong',         'park',        ST_GeomFromText('POINT(101.6356 3.2147)', 4326)),
((SELECT id FROM zones WHERE name='Kepong'), 'Kepong Sentral Mall',               'mall',        ST_GeomFromText('POINT(101.6280 3.2106)', 4326)),
-- Puchong
((SELECT id FROM zones WHERE name='Puchong'), 'IOI City Mall',                    'mall',        ST_GeomFromText('POINT(101.7217 2.9716)', 4326)),
((SELECT id FROM zones WHERE name='Puchong'), 'Puchong Perdana',                  'residential', ST_GeomFromText('POINT(101.6213 3.0126)', 4326))
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Seed: Strategy Blocks
-- ─────────────────────────────────────────────
INSERT INTO strategy_blocks (start_time, end_time, day_type, target_categories, label) VALUES
('05:00', '08:00', 'weekday', ARRAY['residential','transit']::poi_category[],      'Early Morning Commuter'),
('08:00', '10:00', 'weekday', ARRAY['hospital','university']::poi_category[],      'Morning Institutions'),
('10:00', '12:00', 'weekday', ARRAY['office','mall']::poi_category[],              'Mid-Morning CBD'),
('12:00', '14:00', 'weekday', ARRAY['office','mall']::poi_category[],              'Lunch Rush'),
('14:00', '16:00', 'weekday', ARRAY['mall','transit']::poi_category[],             'Post-Lunch Drift'),
('16:00', '20:00', 'weekday', ARRAY['office','transit']::poi_category[],           'Evening Peak'),
('20:00', '23:59', 'weekday', ARRAY['mall','tourist','transit']::poi_category[],   'Night Economy'),
('05:00', '12:00', 'weekend', ARRAY['residential','transit']::poi_category[],      'Weekend Morning'),
('12:00', '22:00', 'weekend', ARRAY['mall','park','tourist']::poi_category[],      'Weekend Leisure'),
('22:00', '23:59', 'weekend', ARRAY['mall','transit']::poi_category[],             'Weekend Late Night')
ON CONFLICT (start_time, end_time, day_type) DO NOTHING;
