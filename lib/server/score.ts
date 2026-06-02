// Klang Valley e-hailing earnings model.
// Scores a zone by ESTIMATED NET RM/HOUR ONLINE — across the full driver cycle
// (wait → deadhead to pickup → paid trip), not just the paid trip. This is what
// actually beats idle waiting ("sidai"): a zone with great fares but long waits
// loses to a zone with back-to-back short hops.

const BASE_FARE     = 2.0;   // RM
const DISTANCE_RATE = 0.25;  // RM per km
const TIME_RATE     = 0.43;  // RM per minute
const FUEL_PENALTY  = 0.10;  // RM per km (22.0 km/l baseline)
const MIN_PROFIT_HR = 15.0;  // RM/hr floor — below this a zone is a trap

// Cycle-time tuning constants.
const WAIT_MAX_MINS    = 30;  // idle wait when demand index = 1.0 (scales down as demand rises)
const PICKUP_BASE_MINS = 6;   // empty-drive time to passenger at free-flow traffic
const SCORE_CEIL_HR    = 65;  // RM/hr that maps to a FinalScore of 100

interface HistoricalProfile {
  distanceKm: number;
  baseTimeMins: number;
}

// Zone historical ride profiles (fallback averages) keyed by POI category.
const PROFILES: Record<string, HistoricalProfile> = {
  office:      { distanceKm: 15, baseTimeMins: 35 },
  transit:     { distanceKm: 4,  baseTimeMins: 10 },
  residential: { distanceKm: 4,  baseTimeMins: 10 },
  mall:        { distanceKm: 6,  baseTimeMins: 15 },
  nightlife:   { distanceKm: 7,  baseTimeMins: 18 },
  tourist:     { distanceKm: 6,  baseTimeMins: 15 },
  hospital:    { distanceKm: 8,  baseTimeMins: 20 },
  university:  { distanceKm: 8,  baseTimeMins: 20 },
  airport:     { distanceKm: 18, baseTimeMins: 30 }, // long, lucrative airport runs
  hotel:       { distanceKm: 9,  baseTimeMins: 20 },
  stadium:     { distanceKm: 8,  baseTimeMins: 22 },
  market:      { distanceKm: 4,  baseTimeMins: 12 },
  government:  { distanceKm: 7,  baseTimeMins: 18 },
  school:      { distanceKm: 5,  baseTimeMins: 14 },
};

const DEFAULT_PROFILE: HistoricalProfile = { distanceKm: 8, baseTimeMins: 20 };

export interface LiveMetrics {
  activeCategory: string;   // POI category for the current time block
  currentSpeed: number;     // km/h, from TomTom
  freeFlowSpeed: number;    // km/h, from TomTom
  congestionRatio: number;  // currentSpeed / freeFlowSpeed (1.0 = free flow)
  weatherStatus: string;    // from OpenWeather (e.g. 'Rain', 'Clear')
  demandIndex: number;      // sum of matched-POI category weights (higher = more rides, less wait)
}

export interface ScoreResult {
  finalScore: number;        // 0–100
  netProfitPerHour: number;  // RM/hr online (the real ranking signal)
  grossFare: number;         // RM per trip
  netPerTrip: number;        // RM per trip after fuel
  tripTimeMins: number;
  waitTimeMins: number;
  deadheadTimeMins: number;
  cycleTimeMins: number;
  surgeMultiplier: number;
  profile: HistoricalProfile;
  isBlacklisted: boolean;
}

export function calculateZoneScore(_zone: { name?: string }, m: LiveMetrics): ScoreResult {
  // 1–2. Resolve the historical ride profile for the active category.
  const profile = PROFILES[m.activeCategory] ?? DEFAULT_PROFILE;
  const { distanceKm, baseTimeMins } = profile;

  // Guard against missing/zero traffic data.
  const freeFlow   = m.freeFlowSpeed > 0 ? m.freeFlowSpeed : 50;
  const ratio      = m.congestionRatio > 0 ? Math.min(1, m.congestionRatio) : 0.6;
  const liveSpeed  = m.currentSpeed > 0 ? m.currentSpeed : freeFlow * ratio;

  // 3–4. Paid-trip time = profile base time + live traffic delay over the trip distance.
  const freeFlowTripMins = (distanceKm / freeFlow) * 60;
  const liveTripMins     = (distanceKm / liveSpeed) * 60;
  const trafficDelayMins = Math.max(0, liveTripMins - freeFlowTripMins);
  const tripTimeMins     = baseTimeMins + trafficDelayMins;

  // Dead time the driver eats but isn't paid for — the anti-sidai core.
  // Wait shrinks as demand rises; deadhead grows as traffic worsens.
  const demand           = Math.max(0.5, m.demandIndex);
  const waitTimeMins     = Math.min(WAIT_MAX_MINS, WAIT_MAX_MINS / demand);
  const deadheadTimeMins = PICKUP_BASE_MINS / ratio;
  const deadheadKm       = (deadheadTimeMins / 60) * liveSpeed;

  const cycleTimeMins = tripTimeMins + waitTimeMins + deadheadTimeMins;

  // 5. Weather surge override.
  const wet = m.weatherStatus === 'Rain' || m.weatherStatus === 'Thunderstorm';
  const surgeMultiplier = wet ? 2.0 : 1.0;

  // 6. Gross fare for the paid trip.
  const grossFare =
    (BASE_FARE + distanceKm * DISTANCE_RATE + tripTimeMins * TIME_RATE) * surgeMultiplier;

  // 7. Net per trip after fuel — fuel burned on BOTH the trip and the empty pickup drive.
  const netPerTrip = grossFare - (distanceKm + deadheadKm) * FUEL_PENALTY;

  // Net RM per hour ONLINE: divide by full cycle time, not just the trip.
  const netProfitPerHour = cycleTimeMins > 0 ? (netPerTrip / cycleTimeMins) * 60 : 0;

  // 8. Map to 0–100; hard-zero + blacklist below the profit floor.
  let finalScore: number;
  if (netProfitPerHour < MIN_PROFIT_HR) {
    finalScore = 0;
  } else {
    finalScore = Math.min(
      100,
      Math.round(((netProfitPerHour - MIN_PROFIT_HR) / (SCORE_CEIL_HR - MIN_PROFIT_HR)) * 100),
    );
  }

  return {
    finalScore,
    netProfitPerHour: round2(netProfitPerHour),
    grossFare:        round2(grossFare),
    netPerTrip:       round2(netPerTrip),
    tripTimeMins:     round2(tripTimeMins),
    waitTimeMins:     round2(waitTimeMins),
    deadheadTimeMins: round2(deadheadTimeMins),
    cycleTimeMins:    round2(cycleTimeMins),
    surgeMultiplier,
    profile,
    isBlacklisted: finalScore === 0,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
