'use strict';
/**
 * Harvester: runs every 10 minutes via node-cron.
 * 1. Loads all zones + strategy blocks from Postgres.
 * 2. Hits TomTom Flow API for each zone centroid.
 * 3. Hits OpenWeather Current API once per unique lat/lng cluster.
 * 4. Calculates EfficiencyScore per zone.
 * 5. Writes `live_zone_metrics` hash + `live_recommendations` to Redis.
 */

const axios  = require('axios');
const db     = require('./db');
const redis  = require('./redis');

const TOMTOM_KEY      = process.env.TOMTOM_API_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const REDIS_TTL_SEC   = 720; // 12 min — slightly longer than cron interval

// ── Weather severity multiplier (penalty on EfficiencyScore)
const WEATHER_PENALTY = {
  Thunderstorm: 0.60,
  Drizzle:      0.85,
  Rain:         0.75,
  Snow:         0.50,  // unlikely in KL, safety net
  Atmosphere:   0.90,  // mist/haze/fog
  Clear:        1.00,
  Clouds:       1.00,
};

// ── Surge multiplier by category cluster (demand-side assumption)
const CATEGORY_SURGE = {
  transit:     1.40,
  office:      1.30,
  mall:        1.20,
  hospital:    1.15,
  university:  1.25,
  residential: 1.10,
  tourist:     1.20,
  park:        1.05,
};

// ── Minimum EfficiencyScore to avoid blacklist
const BLACKLIST_THRESHOLD = 0.40;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getActiveDayType() {
  const day = new Date().getDay(); // 0=Sun,6=Sat
  return (day === 0 || day === 6) ? 'weekend' : 'weekday';
}

function getCurrentTimeBlock(blocks, dayType) {
  const now    = new Date();
  const hhmm   = now.getHours() * 60 + now.getMinutes();
  const active = blocks.filter((b) => {
    if (b.day_type !== dayType) return false;
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    return hhmm >= sh * 60 + sm && hhmm < eh * 60 + em;
  });
  return active;
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Bearing in degrees from (lat1,lng1) toward (lat2,lng2).
 */
function bearingTo(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function bearingLabel(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ────────────────────────────────────────────────────────────
// API Calls
// ────────────────────────────────────────────────────────────

/**
 * TomTom Traffic Flow — returns { currentSpeed, freeFlowSpeed, confidence }
 * Uses the Flow Segment Data endpoint with point + zoom.
 */
async function fetchTrafficFlow(lat, lng) {
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`;
    const { data } = await axios.get(url, {
      params: { point: `${lat},${lng}`, key: TOMTOM_KEY },
      timeout: 8000,
    });
    const fd = data.flowSegmentData;
    return {
      currentSpeed:  fd.currentSpeed,
      freeFlowSpeed: fd.freeFlowSpeed,
      confidence:    fd.confidence,
      congestionRatio: fd.currentSpeed / fd.freeFlowSpeed, // 1.0=free, <0.5=gridlock
    };
  } catch (err) {
    console.warn(`[Harvester] TomTom failed for (${lat},${lng}): ${err.message}`);
    return { currentSpeed: 30, freeFlowSpeed: 50, confidence: 0, congestionRatio: 0.6 };
  }
}

/**
 * OpenWeather Current — returns { main, description, tempC, humidity, weatherPenalty }
 */
async function fetchWeather(lat, lng) {
  try {
    const url = 'https://api.openweathermap.org/data/2.5/weather';
    const { data } = await axios.get(url, {
      params: { lat, lon: lng, appid: OPENWEATHER_KEY, units: 'metric' },
      timeout: 8000,
    });
    const mainGroup = data.weather[0].main; // e.g. "Rain"
    return {
      main:           mainGroup,
      description:    data.weather[0].description,
      tempC:          data.main.temp,
      humidity:       data.main.humidity,
      weatherPenalty: WEATHER_PENALTY[mainGroup] ?? 1.0,
    };
  } catch (err) {
    console.warn(`[Harvester] OpenWeather failed for (${lat},${lng}): ${err.message}`);
    return { main: 'Unknown', description: 'N/A', tempC: 28, humidity: 80, weatherPenalty: 1.0 };
  }
}

// ────────────────────────────────────────────────────────────
// EfficiencyScore Calculation
// ────────────────────────────────────────────────────────────

/**
 * EfficiencyScore = (ExpectedFares * SurgeMultiplier * weatherPenalty)
 *                  / (driveTimeHr + trafficDelayHr)
 *
 * ExpectedFares: base demand score from active POI category weight × POI count in zone
 * driveTimeHr:  distance from driver base / zone free-flow speed
 * trafficDelayHr: added delay from congestion ratio
 */
function calcEfficiencyScore({
  zonePois,
  activeCategories,
  distanceKm,
  baseSpeedKmh,
  congestionRatio,
  freeFlowSpeed,
  weatherPenalty,
  driverBaseLat,
  driverBaseLng,
  zoneCentroidLat,
  zoneCentroidLng,
}) {
  // Effective speed under current traffic
  const effectiveSpeed = freeFlowSpeed * congestionRatio;
  if (effectiveSpeed < 1) return 0;

  const driveTimeHr    = distanceKm / effectiveSpeed;
  const freeFlowTimeHr = distanceKm / baseSpeedKmh;
  const trafficDelayHr = Math.max(0, driveTimeHr - freeFlowTimeHr);

  // Count POIs matching active strategy categories and accumulate surge weight
  let totalSurge  = 0;
  let matchedPois = 0;
  for (const poi of zonePois) {
    if (activeCategories.includes(poi.category)) {
      totalSurge += CATEGORY_SURGE[poi.category] ?? 1.0;
      matchedPois++;
    }
  }
  if (matchedPois === 0) return 0;

  const avgSurge      = totalSurge / matchedPois;
  const expectedFares = matchedPois * 1.5; // base fares per active POI per hour
  const denominator   = driveTimeHr + trafficDelayHr;
  if (denominator <= 0) return 0;

  const score = (expectedFares * avgSurge * weatherPenalty) / denominator;
  return Math.round(score * 100) / 100;
}

// ────────────────────────────────────────────────────────────
// Profitability Check
// ────────────────────────────────────────────────────────────

function calcFuelCost(distanceKm, fuelEfficiency, fuelPriceMyr) {
  return (distanceKm / fuelEfficiency) * fuelPriceMyr;
}

// ────────────────────────────────────────────────────────────
// Main Harvest Run
// ────────────────────────────────────────────────────────────

async function runHarvest() {
  console.log(`[Harvester] Run started at ${new Date().toISOString()}`);

  // 1. Load zones with centroids
  const zonesRes = await db.query(`
    SELECT id, name, base_speed_kmh, lat, lng
    FROM zones
    ORDER BY id
  `);
  const zones = zonesRes.rows;

  // 2. Load all POIs grouped by zone
  const poisRes = await db.query(`
    SELECT id, zone_id, name, category, lat, lng
    FROM pois
  `);
  const poisByZone = {};
  for (const p of poisRes.rows) {
    (poisByZone[p.zone_id] = poisByZone[p.zone_id] || []).push(p);
  }

  // 3. Load strategy blocks + driver params
  const [blocksRes, driverRes] = await Promise.all([
    db.query('SELECT * FROM strategy_blocks'),
    db.query('SELECT * FROM driver_params WHERE id = 1'),
  ]);
  // pg returns Postgres arrays as strings e.g. "{mall,transit}" — parse to JS arrays
  const blocks = blocksRes.rows.map(b => ({
    ...b,
    target_categories: Array.isArray(b.target_categories)
      ? b.target_categories
      : b.target_categories.replace(/^\{|\}$/g, '').split(','),
  }));
  const driver = driverRes.rows[0];

  const dayType        = getActiveDayType();
  const activeBlocks   = getCurrentTimeBlock(blocks, dayType);
  const activeCategories = [...new Set(activeBlocks.flatMap((b) => b.target_categories))];

  console.log(`[Harvester] Day: ${dayType} | Active blocks: ${activeBlocks.map(b => b.label).join(', ')}`);
  console.log(`[Harvester] Target categories: ${activeCategories.join(', ')}`);

  // 4. Fetch weather once for KL centre (representative for all KV zones)
  const kvLat = 3.1390, kvLng = 101.6869;
  const weather = await fetchWeather(kvLat, kvLng);
  console.log(`[Harvester] Weather: ${weather.main} (${weather.description}), penalty=${weather.weatherPenalty}`);

  // 5. Fetch traffic + score each zone (concurrently, max 5 at a time)
  const zoneMetrics = [];

  async function processZone(zone) {
    const traffic  = await fetchTrafficFlow(zone.lat, zone.lng);
    const distance = haversine(
      parseFloat(driver.base_lat), parseFloat(driver.base_lng),
      zone.lat, zone.lng
    );
    const pois   = poisByZone[zone.id] || [];
    const score  = calcEfficiencyScore({
      zonePois:        pois,
      activeCategories,
      distanceKm:      distance,
      baseSpeedKmh:    parseFloat(zone.base_speed_kmh),
      congestionRatio: traffic.congestionRatio,
      freeFlowSpeed:   traffic.freeFlowSpeed,
      weatherPenalty:  weather.weatherPenalty,
      driverBaseLat:   parseFloat(driver.base_lat),
      driverBaseLng:   parseFloat(driver.base_lng),
      zoneCentroidLat: zone.lat,
      zoneCentroidLng: zone.lng,
    });

    const fuelCost = calcFuelCost(
      distance,
      parseFloat(driver.fuel_efficiency),
      parseFloat(driver.fuel_price_myr)
    );
    const bearing  = bearingTo(
      parseFloat(driver.base_lat), parseFloat(driver.base_lng),
      zone.lat, zone.lng
    );
    const isBlacklisted = score < BLACKLIST_THRESHOLD || traffic.congestionRatio < 0.35;
    const matchedPois   = pois.filter(p => activeCategories.includes(p.category));

    return {
      zoneId:          zone.id,
      zoneName:        zone.name,
      lat:             zone.lat,
      lng:             zone.lng,
      efficiencyScore: score,
      congestionRatio: Math.round(traffic.congestionRatio * 100) / 100,
      currentSpeedKmh: traffic.currentSpeed,
      freeFlowSpeedKmh:traffic.freeFlowSpeed,
      distanceKm:      Math.round(distance * 10) / 10,
      fuelCostMyr:     Math.round(fuelCost * 100) / 100,
      bearingDeg:      Math.round(bearing),
      bearingLabel:    bearingLabel(bearing),
      weather:         { ...weather },
      matchedPoiCount: matchedPois.length,
      matchedPois:     matchedPois.map(p => ({ name: p.name, category: p.category })),
      isBlacklisted,
      blacklistReason: isBlacklisted
        ? (traffic.congestionRatio < 0.35
          ? 'Gridlocked — congestion >65%'
          : `EfficiencyScore ${score} below threshold ${BLACKLIST_THRESHOLD}`)
        : null,
    };
  }

  // Concurrency batch of 5
  for (let i = 0; i < zones.length; i += 5) {
    const batch   = zones.slice(i, i + 5);
    const results = await Promise.all(batch.map(processZone));
    zoneMetrics.push(...results);
  }

  // 6. Sort by score descending
  const ranked     = [...zoneMetrics].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  const best       = ranked.find(z => !z.isBlacklisted);
  const blacklisted= zoneMetrics.filter(z => z.isBlacklisted).map(z => z.zoneName);

  // 7. Best start time prediction (next 30-min window with highest surge category)
  const nextSurgeWindow = predictNextSurgeWindow(blocks, dayType);

  // 8. Build recommendations payload
  const recommendations = {
    generatedAt:      new Date().toISOString(),
    dayType,
    activeBlocks:     activeBlocks.map(b => ({ label: b.label, start: b.start_time, end: b.end_time })),
    activeCategories,
    weather:          { main: weather.main, description: weather.description, penalty: weather.weatherPenalty },
    bestStartTime:    nextSurgeWindow,
    targetZone:       best ? {
      name:            best.zoneName,
      efficiencyScore: best.efficiencyScore,
      direction:       `${best.bearingLabel} (${best.bearingDeg}°)`,
      distanceKm:      best.distanceKm,
      fuelCostMyr:     best.fuelCostMyr,
      speedKmh:        best.currentSpeedKmh,
      matchedPois:     best.matchedPois,
    } : null,
    blacklistedZones: blacklisted,
    topZones:         ranked.slice(0, 5).map(z => ({
      name:            z.zoneName,
      score:           z.efficiencyScore,
      direction:       `${z.bearingLabel} (${z.bearingDeg}°)`,
      distanceKm:      z.distanceKm,
      congestion:      z.congestionRatio,
      blacklisted:     z.isBlacklisted,
    })),
  };

  // 9. Write to Redis
  const pipeline = redis.pipeline();

  // Per-zone hash
  for (const m of zoneMetrics) {
    pipeline.hset('live_zone_metrics', m.zoneName, JSON.stringify(m));
  }
  pipeline.expire('live_zone_metrics', REDIS_TTL_SEC);

  // Recommendations
  pipeline.set('live_recommendations', JSON.stringify(recommendations), 'EX', REDIS_TTL_SEC);

  // Ranked list for quick UI fetch
  pipeline.set('live_ranked_zones', JSON.stringify(ranked), 'EX', REDIS_TTL_SEC);

  await pipeline.exec();

  console.log(`[Harvester] Done. Best zone: ${best?.zoneName ?? 'NONE'} | Score: ${best?.efficiencyScore ?? 0}`);
  console.log(`[Harvester] Blacklisted: [${blacklisted.join(', ')}]`);
}

// ────────────────────────────────────────────────────────────
// Predict next surge window from strategy blocks
// ────────────────────────────────────────────────────────────

function predictNextSurgeWindow(blocks, dayType) {
  const now  = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();

  // High-value categories that justify starting early
  const highValueCats = new Set(['transit', 'office', 'hospital', 'university']);

  const upcoming = blocks
    .filter(b => b.day_type === dayType)
    .map(b => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const minutesUntil = startMin - hhmm;
      const hasHighValue = b.target_categories.some(c => highValueCats.has(c));
      return { ...b, startMin, minutesUntil, hasHighValue };
    })
    .filter(b => b.minutesUntil > 0 && b.minutesUntil <= 120) // within next 2 hours
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  if (upcoming.length === 0) {
    return { message: 'You are in an active surge window. Stay online.', minutesUntil: 0 };
  }

  const next = upcoming[0];
  const goOnlineAt = new Date(now.getTime() + (next.minutesUntil - 15) * 60000);
  const fmt = (d) => d.toTimeString().slice(0, 5);

  return {
    message:        `Go ONLINE at ${fmt(goOnlineAt)} to catch the "${next.label}" surge starting at ${next.start_time}`,
    goOnlineAt:     fmt(goOnlineAt),
    surgeStartsAt:  next.start_time,
    label:          next.label,
    minutesUntil:   next.minutesUntil,
    targetCategories: next.target_categories,
  };
}

module.exports = { runHarvest };
