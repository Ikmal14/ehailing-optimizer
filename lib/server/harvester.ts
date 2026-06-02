import axios from 'axios';
import pool from './db';
import redis from './redis';
import { calculateZoneScore } from './score';
import { recommendBestStartTime } from './startTime';

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

// Malaysia is UTC+8 with no daylight saving. Vercel servers run UTC, so we
// shift by +8h and read the UTC fields to get Malaysia wall-clock time.
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
export function nowMYT(): Date {
  return new Date(Date.now() + MYT_OFFSET_MS);
}

function getActiveDayType(): 'weekday' | 'weekend' {
  const d = nowMYT().getUTCDay();
  return d === 0 || d === 6 ? 'weekend' : 'weekday';
}

function getCurrentTimeBlock(blocks: any[], dayType: string) {
  const now  = nowMYT();
  const hhmm = now.getUTCHours() * 60 + now.getUTCMinutes();
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
      main,
      description:    data.weather[0].description,
      tempC:          data.main.temp,
      feelsLikeC:     data.main.feels_like,
      humidity:       data.main.humidity,
      windKmh:        (data.wind?.speed ?? 0) * 3.6, // m/s → km/h
      rainMm:         data.rain?.['1h'] ?? 0,         // mm in last hour
      weatherPenalty: WEATHER_PENALTY[main] ?? 1.0,
    };
  } catch {
    return { main: 'Unknown', description: 'N/A', tempC: 28, feelsLikeC: 30, humidity: 80, windKmh: 0, rainMm: 0, weatherPenalty: 1.0 };
  }
}

// Official Malaysian weekly retail fuel prices from data.gov.my (free, no key).
// RON95 is government-capped (long stable at RM2.05); RON97 & diesel float weekly.
async function fetchFuelPrice() {
  try {
    const { data } = await axios.get('https://api.data.gov.my/data-catalogue', {
      params: { id: 'fuelprice', limit: 1, sort: '-date' },
      timeout: 8000,
    });
    const row = Array.isArray(data) ? data[0] : data?.data?.[0];
    if (!row) throw new Error('no fuel data');
    return {
      ron95:  Number(row.ron95),
      ron97:  Number(row.ron97),
      diesel: Number(row.diesel),
      budi95: 1.99, // BUDI95 subsidised RON95 for eligible Malaysians
      date:   row.date as string,
      source: 'data.gov.my',
    };
  } catch {
    // Fallback prices (post-BUDI95: market RON95 ~RM2.60, subsidised RM1.99).
    return { ron95: 2.60, ron97: 3.47, diesel: 2.88, budi95: 1.99, date: null, source: 'fallback' };
  }
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

  // Weather at the driver's actual base; fuel price nationwide.
  const [weather, fuelPrice] = await Promise.all([
    fetchWeather(parseFloat(driver.base_lat), parseFloat(driver.base_lng)),
    fetchFuelPrice(),
  ]);

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
      weather: { main: weather.main, description: weather.description, penalty: weather.weatherPenalty, tempC: Math.round(weather.tempC), feelsLikeC: Math.round(weather.feelsLikeC), humidity: weather.humidity, windKmh: Math.round(weather.windKmh), rainMm: Math.round(weather.rainMm * 10) / 10 },
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
    weather: {
      main: weather.main, description: weather.description, penalty: weather.weatherPenalty,
      tempC: Math.round(weather.tempC), feelsLikeC: Math.round(weather.feelsLikeC),
      humidity: weather.humidity, windKmh: Math.round(weather.windKmh),
      rainMm: Math.round(weather.rainMm * 10) / 10,
    },
    fuelPrice,
    bestStartTime: recommendBestStartTime({
      now: nowMYT(),
      dayType,
      blocks,
      liveBestNetPerHour: best?.netProfitPerHour ?? 0,
      weatherMain: weather.main,
    }),
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
