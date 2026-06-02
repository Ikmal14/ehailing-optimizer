// Empty string = same-origin (Next.js API routes). Override with NEXT_PUBLIC_API_URL for a separate backend.
const BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface WeatherInfo {
  main: string;
  description: string;
  penalty: number;
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  rainMm?: number;
}

export interface TargetZone {
  name: string;
  efficiencyScore: number;
  netProfitPerHour: number;
  direction: string;
  distanceKm: number;
  fuelCostMyr: number;
  speedKmh: number;
  matchedPois: { name: string; category: string }[];
}

export interface TopZone {
  name: string;
  score: number;
  netProfitPerHour: number;
  direction: string;
  distanceKm: number;
  congestion: number;
  blacklisted: boolean;
}

export interface BestStartTime {
  status: 'go_now' | 'wait' | 'low_demand';
  headline: string;
  message: string;
  reason: string;
  demandNow: number;            // 0–100
  minutesUntil: number;
  goOnlineAt?: string;
  windowLabel?: string;
  windowStartsAt?: string;
  targetCategories?: string[];
}

export interface FuelPrice {
  ron95: number;
  ron97: number;
  diesel: number;
  budi95: number;
  date: string | null;
  source: string;
}

export interface Recommendations {
  generatedAt: string;
  dayType: 'weekday' | 'weekend';
  activeBlocks: { label: string; start: string; end: string }[];
  activeCategories: string[];
  weather: WeatherInfo;
  fuelPrice?: FuelPrice;
  bestStartTime: BestStartTime;
  targetZone: TargetZone | null;
  blacklistedZones: string[];
  topZones: TopZone[];
}

export interface ZoneMetric {
  zoneId: number;
  zoneName: string;
  lat: number;
  lng: number;
  efficiencyScore: number;
  congestionRatio: number;
  currentSpeedKmh: number;
  freeFlowSpeedKmh: number;
  distanceKm: number;
  fuelCostMyr: number;
  bearingDeg: number;
  bearingLabel: string;
  weather: { main: string; description: string; penalty: number };
  matchedPoiCount: number;
  matchedPois: { name: string; category: string }[];
  isBlacklisted: boolean;
  blacklistReason: string | null;
}

export interface DriverParams {
  fuel_efficiency: string;
  fuel_price_myr: string;
  base_lat: string;
  base_lng: string;
  min_profit_threshold: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 0 } });
  if (!res.ok || res.status === 202) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Owner access key (stored locally, set once in Settings) — sent on writes.
const ACCESS_KEY = 'app_access_key';
export function getAccessKey(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(ACCESS_KEY) ?? '';
}
export function setAccessKey(v: string) {
  localStorage.setItem(ACCESS_KEY, v);
}
function authHeaders(): Record<string, string> {
  const k = getAccessKey();
  return k ? { 'x-app-secret': k } : {};
}

export const api = {
  recommendations: () => get<Recommendations>('/api/recommendations'),
  rankedZones:     () => get<ZoneMetric[]>('/api/zones/ranked'),
  driverParams:    () => get<DriverParams>('/api/driver-params'),
  triggerHarvest:  () => fetch(`${BASE}/api/harvest/run`, { method: 'POST' }),
  updateDriver: (body: Partial<DriverParams>) =>
    fetch(`${BASE}/api/driver-params`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
};
