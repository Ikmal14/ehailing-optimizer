-- Migration 002: richer demand signal
-- Adds new POI categories, a per-zone demand weight, and more POIs.

-- New POI categories (safe to re-run)
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'airport';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'nightlife';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'hotel';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'stadium';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'market';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'government';
ALTER TYPE poi_category ADD VALUE IF NOT EXISTS 'school';

-- Per-zone demand weight (population / activity multiplier; 1.0 = average).
ALTER TABLE zones ADD COLUMN IF NOT EXISTS demand_weight NUMERIC(4,2) NOT NULL DEFAULT 1.0;

UPDATE zones SET demand_weight = 1.40 WHERE name = 'Kuala Lumpur City Centre';
UPDATE zones SET demand_weight = 1.25 WHERE name = 'Petaling Jaya';
UPDATE zones SET demand_weight = 1.15 WHERE name = 'Subang Jaya';
UPDATE zones SET demand_weight = 1.10 WHERE name = 'Bangsar';
UPDATE zones SET demand_weight = 1.05 WHERE name = 'Mont Kiara';
UPDATE zones SET demand_weight = 1.00 WHERE name = 'Cheras';
UPDATE zones SET demand_weight = 1.00 WHERE name = 'Ampang';
UPDATE zones SET demand_weight = 0.95 WHERE name = 'Shah Alam';
UPDATE zones SET demand_weight = 0.90 WHERE name = 'Kepong';
UPDATE zones SET demand_weight = 0.90 WHERE name = 'Puchong';
