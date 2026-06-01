import axios from 'axios';
import pool from './db';
import redis from './redis';
import { calculateZoneScore } from './score';

const TOMTOM_KEY      = process.env.TOMTOM_API_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const REDIS_TTL       = 720;

const WEATHER_PENALTY: Record<string, number> = {
  Thunderstorm: 0.60, Drizzle: 0.85, Rain: 0.75,
  Snow: 0.50, Atmosphere: 0.90, Clear: 1.00, Clouds: 1.00,
};

const CATEGORY_SURGE: Record<string, number> = {
  transit: 1.40, office: 1.30, mall: 1.20, hospital: 1.15,
  university: 1.25, residential: 1.10, tourist: 1.20, park: 1.05,
};

function getActiveDayType(): 'weekday' | 'weekend' {
  const d = new Date().getDay();
  return d === 0 || d === 6 ? 'weekend' : 'weekday';
}

function getCurrentTimeBlock(blocks: any[], dayType: string) {
  const now  = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  return blocks.filter((b) => {
    if (b.day_type !== dayType) return false;
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    return hhmm >= sh * 60 + sm && hhmm < eh * 60 + em;
  });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingTo(lat1: number, lng1: number, lat2: number, lng2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function bearingLabel(deg: number) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}

async function fetchTrafficFlow(lat: number, lng: number) {
  try {
    const { data } = await axios.get(
      'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json',
      { params: { point: `${lat},${lng}`, key: TOMTOM_KEY }, timeout: 8000 }
    );
    const fd = data.flowSegmentData;
    return {
      currentSpeed:    fd.currentSpeed,
      freeFlowSpeed:   fd.freeFlowSpeed,
      confidence:      fd.confidence,
      congestionRatio: fd.currentSpeed / fd.freeFlowSpeed,
    };
  } catch {
    return { currentSpeed: 30, freeFlowSpeed: 50, confidence: 0, congestionRatio: 0.6 };
  }
}

async function fetchWeather(lat: number, lng: number) {
  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon: lng, appid: OPENWEATHER_KEY, units: 'metric' },
      timeout: 8000,
    });
    const main = data.weather[0].main;
    return {
      main, description: data.weather[0].description,
      tempC: data.main.temp, humidity: data.main.humidity,
      weatherPenalty: WEATHER_PENALTY[main] ?? 1.0,
    };
  } catch {
    return { main: 'Unknown', description: 'N/A', tempC: 28, humidity: 80, weatherPenalty: 1.0 };
  }
}

function predictNextSurgeWindow(blocks: any[], dayType: string) {
  const now  = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  const highValue = new Set(['transit', 'office', 'hospital', 'university']);
  const upcoming = blocks
    .filter(b => b.day_type === dayType)
    .map(b => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      return { ...b, startMin, minutesUntil: startMin - hhmm };
    })
    .filter(b => b.minutesUntil > 0 && b.minutesUntil <= 120)
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  if (!upcoming.length) return { message: 'You are in an active surge window. Stay online.', minutesUntil: 0 };

  const next = upcoming[0];
  const goOnlineAt = new Date(now.getTime() + (next.minutesUntil - 15) * 60000);
  const fmt = (d: Date) => d.toTimeString().slice(0, 5);
  return {
    message:          `Go ONLINE at ${fmt(goOnlineAt)} to catch the "${next.label}" surge starting at ${next.start_time}`,
    goOnlineAt:       fmt(goOnlineAt),
    surgeStartsAt:    next.start_time,
    label:            next.label,
    minutesUntil:     next.minutesUntil,
    targetCategories: next.target_categories,
  };
}

export async function runHarvest() {
  const zonesRes  = await pool.query('SELECT id, name, base_speed_kmh, lat, lng FROM zones ORDER BY id');
  const poisRes   = await pool.query('SELECT id, zone_id, name, category, lat, lng FROM pois');
  const [blocksRes, driverRes] = await Promise.all([
    pool.query('SELECT * FROM strategy_blocks'),
    pool.query('SELECT * FROM driver_params WHERE id = 1'),
  ]);

  const zones  = zonesRes.rows;
  const driver = driverRes.rows[0];
  const blocks = blocksRes.rows.map((b: any) => ({
    ...b,
    target_categories: Array.isArray(b.target_categories)
      ? b.target_categories
      : b.target_categories.replace(/^\{|\}$/g, '').split(','),
  }));

  const poisByZone: Record<number, any[]> = {};
  for (const p of poisRes.rows) {
    (poisByZone[p.zone_id] = poisByZone[p.zone_id] || []).push(p);
  }

  const dayType        = getActiveDayType();
  const activeBlocks   = getCurrentTimeBlock(blocks, dayType);
  const activeCategories = [...new Set(activeBlocks.flatMap((b: any) => b.target_categories))] as string[];

  const weather = await fetchWeather(3.1390, 101.6869);

  const zoneMetrics: any[] = [];

  async function processZone(zone: any) {
    const traffic  = await fetchTrafficFlow(parseFloat(zone.lat), parseFloat(zone.lng));
    const distance = haversine(
      parseFloat(driver.base_lat), parseFloat(driver.base_lng),
      parseFloat(zone.lat), parseFloat(zone.lng)
    );
    const pois        = poisByZone[zone.id] || [];
    const matchedPois = pois.filter((p: any) => activeCategories.includes(p.category));

    // Demand index = sum of matched-POI category weights (more/higher-value POIs → more rides → less wait).
    const demandIndex = matchedPois.reduce(
      (sum: number, p: any) => sum + (CATEGORY_SURGE[p.category] ?? 1.0),
      0,
    );

    // Active category for this zone = the highest-weight matched category present here.
    const activeCategory =
      matchedPois
        .map((p: any) => p.category)
        .sort((a: string, b: string) => (CATEGORY_SURGE[b] ?? 0) - (CATEGORY_SURGE[a] ?? 0))[0]
      ?? activeCategories[0]
      ?? 'default';

    const result = calculateZoneScore(
      { name: zone.name },
      {
        activeCategory,
        currentSpeed:    traffic.currentSpeed,
        freeFlowSpeed:   traffic.freeFlowSpeed,
        congestionRatio: traffic.congestionRatio,
        weatherStatus:   weather.main,
        demandIndex,
      },
    );

    const fuelCost = (distance / parseFloat(driver.fuel_efficiency)) * parseFloat(driver.fuel_price_myr);
    const bearing  = bearingTo(
      parseFloat(driver.base_lat), parseFloat(driver.base_lng),
      parseFloat(zone.lat), parseFloat(zone.lng)
    );

    // Blacklist: trap zone (below profit floor), no matching demand, or gridlocked.
    const isBlacklisted = result.isBlacklisted || matchedPois.length === 0 || traffic.congestionRatio < 0.35;

    return {
      zoneId: zone.id, zoneName: zone.name,
      lat: parseFloat(zone.lat), lng: parseFloat(zone.lng),
      efficiencyScore:   result.finalScore,
      netProfitPerHour:  result.netProfitPerHour,
      grossFareMyr:      result.grossFare,
      netPerTripMyr:     result.netPerTrip,
      tripTimeMins:      result.tripTimeMins,
      waitTimeMins:      result.waitTimeMins,
      deadheadTimeMins:  result.deadheadTimeMins,
      cycleTimeMins:     result.cycleTimeMins,
      surgeMultiplier:   result.surgeMultiplier,
      profile:           result.profile,
      activeCategory,
      demandIndex:       Math.round(demandIndex * 100) / 100,
      congestionRatio: Math.round(traffic.congestionRatio * 100) / 100,
      currentSpeedKmh: traffic.currentSpeed,
      freeFlowSpeedKmh: traffic.freeFlowSpeed,
      distanceKm: Math.round(distance * 10) / 10,
      fuelCostMyr: Math.round(fuelCost * 100) / 100,
      bearingDeg: Math.round(bearing),
      bearingLabel: bearingLabel(bearing),
      weather: { main: weather.main, description: weather.description, penalty: weather.weatherPenalty },
      matchedPoiCount: matchedPois.length,
      matchedPois: matchedPois.map((p: any) => ({ name: p.name, category: p.category })),
      isBlacklisted,
      blacklistReason: isBlacklisted
        ? (traffic.congestionRatio < 0.35
            ? 'Gridlocked — congestion >65%'
            : matchedPois.length === 0
              ? 'No active demand for current time block'
              : `Trap zone — only RM${result.netProfitPerHour}/hr (below RM15 floor)`)
        : null,
    };
  }

  for (let i = 0; i < zones.length; i += 5) {
    const results = await Promise.all(zones.slice(i, i + 5).map(processZone));
    zoneMetrics.push(...results);
  }

  const ranked      = [...zoneMetrics].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  const best        = ranked.find(z => !z.isBlacklisted);
  const blacklisted = zoneMetrics.filter(z => z.isBlacklisted).map(z => z.zoneName);

  const recommendations = {
    generatedAt: new Date().toISOString(),
    dayType, activeBlocks: activeBlocks.map((b: any) => ({ label: b.label, start: b.start_time, end: b.end_time })),
    activeCategories,
    weather: { main: weather.main, description: weather.description, penalty: weather.weatherPenalty },
    bestStartTime: predictNextSurgeWindow(blocks, dayType),
    targetZone: best ? {
      name: best.zoneName, efficiencyScore: best.efficiencyScore,
      netProfitPerHour: best.netProfitPerHour,
      direction: `${best.bearingLabel} (${best.bearingDeg}°)`,
      distanceKm: best.distanceKm, fuelCostMyr: best.fuelCostMyr,
      speedKmh: best.currentSpeedKmh, matchedPois: best.matchedPois,
    } : null,
    blacklistedZones: blacklisted,
    topZones: ranked.slice(0, 5).map(z => ({
      name: z.zoneName, score: z.efficiencyScore,
      netProfitPerHour: z.netProfitPerHour,
      direction: `${z.bearingLabel} (${z.bearingDeg}°)`,
      distanceKm: z.distanceKm, congestion: z.congestionRatio, blacklisted: z.isBlacklisted,
    })),
  };

  const pipe = redis.pipeline();
  for (const m of zoneMetrics) pipe.hset('live_zone_metrics', m.zoneName, JSON.stringify(m));
  pipe.expire('live_zone_metrics', REDIS_TTL);
  pipe.set('live_recommendations', JSON.stringify(recommendations), 'EX', REDIS_TTL);
  pipe.set('live_ranked_zones', JSON.stringify(ranked), 'EX', REDIS_TTL);
  await pipe.exec();

  return recommendations;
}
