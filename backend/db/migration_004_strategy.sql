-- Migration 004: fold new POI categories into the time-block strategy.
-- Weekday
UPDATE strategy_blocks SET target_categories = ARRAY['residential','transit','market']::poi_category[]
  WHERE day_type='weekday' AND label='Early Morning Commuter';
UPDATE strategy_blocks SET target_categories = ARRAY['hospital','university','school','government']::poi_category[]
  WHERE day_type='weekday' AND label='Morning Institutions';
UPDATE strategy_blocks SET target_categories = ARRAY['office','mall','airport']::poi_category[]
  WHERE day_type='weekday' AND label='Mid-Morning CBD';
UPDATE strategy_blocks SET target_categories = ARRAY['office','mall','hotel']::poi_category[]
  WHERE day_type='weekday' AND label='Lunch Rush';
UPDATE strategy_blocks SET target_categories = ARRAY['office','transit','airport']::poi_category[]
  WHERE day_type='weekday' AND label='Evening Peak';
UPDATE strategy_blocks SET target_categories = ARRAY['mall','tourist','transit','nightlife','hotel']::poi_category[]
  WHERE day_type='weekday' AND label='Night Economy';
-- Weekend
UPDATE strategy_blocks SET target_categories = ARRAY['mall','park','tourist','stadium','hotel']::poi_category[]
  WHERE day_type='weekend' AND label='Weekend Leisure';
UPDATE strategy_blocks SET target_categories = ARRAY['mall','transit','nightlife']::poi_category[]
  WHERE day_type='weekend' AND label='Weekend Late Night';
