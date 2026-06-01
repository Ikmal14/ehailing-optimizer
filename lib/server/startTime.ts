// "Best Start Time" engine.
//
// Decides whether the driver should go online NOW, WAIT for a better window, or
// REST because demand is quiet. It blends two signals:
//
//   1. LIVE now-signal — the best zone's real net RM/hr from this harvest. This is
//      authoritative for the present moment (reflects live traffic, weather, surge).
//   2. FORECAST signal — a Klang Valley time-of-day demand curve. Free-tier APIs
//      can't give us *future* traffic, so upcoming hours use this static prior
//      (when rides are actually available), nudged by current weather.

// Relative ride-availability demand by hour (0–1), tuned for Klang Valley.
const DEMAND_WEEKDAY: number[] = [
  0.25, 0.15, 0.10, 0.08, 0.10, 0.25, 0.45, 0.80, // 00–07
  0.95, 0.75, 0.55, 0.55, 0.75, 0.70, 0.55, 0.55, // 08–15
  0.70, 0.90, 1.00, 0.95, 0.80, 0.60, 0.50, 0.40, // 16–23
];

const DEMAND_WEEKEND: number[] = [
  0.55, 0.45, 0.30, 0.15, 0.10, 0.12, 0.20, 0.30, // 00–07
  0.40, 0.55, 0.65, 0.70, 0.80, 0.80, 0.75, 0.70, // 08–15
  0.70, 0.75, 0.80, 0.85, 0.85, 0.80, 0.70, 0.65, // 16–23
];

// Live earnings thresholds (RM/hr net) for the now-signal.
const GOOD_RM_HR = 25;  // clearly worth driving
const OK_RM_HR   = 18;  // marginal but acceptable

// Demand-curve bands (0–1) for the forecast.
const HIGH_DEMAND = 0.70;
const MOD_DEMAND  = 0.50;

const LEAD_MINS     = 10;   // be positioned slightly before a window opens
const HORIZON_HOURS = 5;    // how far ahead we look for a better window

export interface StartTimeInput {
  now: Date;
  dayType: 'weekday' | 'weekend';
  blocks: any[];               // strategy blocks, for labelling windows
  liveBestNetPerHour: number;  // best non-blacklisted zone's net RM/hr this harvest
  weatherMain: string;         // OpenWeather 'main' (e.g. 'Rain')
}

export interface StartTimeResult {
  status: 'go_now' | 'wait' | 'low_demand';
  headline: string;            // big line for the card
  message: string;             // supporting detail
  reason: string;              // why this verdict
  demandNow: number;           // 0–100, current-hour demand
  minutesUntil: number;        // 0 when go_now
  goOnlineAt?: string;         // "HH:MM"
  windowLabel?: string;        // e.g. "Evening Peak"
  windowStartsAt?: string;     // "HH:MM"
  targetCategories?: string[];
}

function curveFor(dayType: string): number[] {
  return dayType === 'weekend' ? DEMAND_WEEKEND : DEMAND_WEEKDAY;
}

function weatherBoost(main: string): number {
  if (main === 'Thunderstorm') return 0.20;
  if (main === 'Rain' || main === 'Drizzle') return 0.12;
  return 0;
}

function fmt(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

// Find the strategy block covering a given hour, to name the window.
function blockForHour(blocks: any[], dayType: string, hour: number) {
  const mins = hour * 60;
  return blocks.find((b: any) => {
    if (b.day_type !== dayType) return false;
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    return mins >= sh * 60 + sm && mins < eh * 60 + em;
  });
}

export function recommendBestStartTime(input: StartTimeInput): StartTimeResult {
  const { now, dayType, blocks, liveBestNetPerHour, weatherMain } = input;
  const curve = curveFor(dayType);
  const hour  = now.getHours();
  const boost = weatherBoost(weatherMain);

  const demandNowRaw = Math.min(1, curve[hour] + boost);
  const demandNow    = Math.round(demandNowRaw * 100);

  // ── Case 1: live earnings are already strong → go now.
  if (liveBestNetPerHour >= GOOD_RM_HR) {
    return {
      status: 'go_now',
      headline: 'GO ONLINE NOW',
      message: `Strong earnings available right now (~RM${liveBestNetPerHour.toFixed(0)}/hr on the top zone). Head out.`,
      reason: 'live_earnings_strong',
      demandNow,
      minutesUntil: 0,
    };
  }

  // ── Look ahead for the next clearly-better window in the demand curve.
  let best: { hour: number; demand: number } | null = null;
  for (let h = 1; h <= HORIZON_HOURS; h++) {
    const fh = (hour + h) % 24;
    const d  = Math.min(1, curve[fh] + (weatherMain ? 0 : 0)); // forecast uses base curve
    if (d >= HIGH_DEMAND && d > demandNowRaw + 0.1) {
      if (!best || d > best.demand) best = { hour: fh, demand: d };
    }
  }

  // ── Case 2: now is at least moderately busy (even if live net is soft, e.g.
  //    transient traffic) and nothing markedly better is imminent → go now.
  if (demandNowRaw >= MOD_DEMAND && (!best || best.demand <= demandNowRaw + 0.15)) {
    const earn = liveBestNetPerHour >= OK_RM_HR
      ? `Top zone is paying ~RM${liveBestNetPerHour.toFixed(0)}/hr. `
      : '';
    return {
      status: 'go_now',
      headline: 'GOOD TIME TO START',
      message: `${earn}Demand is healthy this hour — worth being online.`,
      reason: 'demand_healthy_now',
      demandNow,
      minutesUntil: 0,
    };
  }

  // ── Case 3: a clearly better window is coming → tell them when to start.
  if (best) {
    const target = new Date(now);
    target.setHours(best.hour, 0, 0, 0);
    if (best.hour <= hour) target.setDate(target.getDate() + 1); // wrapped past midnight
    const goOnline = new Date(target.getTime() - LEAD_MINS * 60000);
    const minutesUntil = Math.max(0, Math.round((goOnline.getTime() - now.getTime()) / 60000));
    const blk = blockForHour(blocks, dayType, best.hour);
    const label = blk?.label ?? 'the next demand peak';

    return {
      status: 'wait',
      headline: `Start at ${fmt(goOnline)}`,
      message: `It's quiet now${liveBestNetPerHour > 0 ? ` (top zone only ~RM${liveBestNetPerHour.toFixed(0)}/hr)` : ''}. Hold off — "${label}" builds around ${fmt(target)}. Go online ~${LEAD_MINS} min early to get positioned.`,
      reason: 'better_window_ahead',
      demandNow,
      minutesUntil,
      goOnlineAt: fmt(goOnline),
      windowLabel: label,
      windowStartsAt: fmt(target),
      targetCategories: blk?.target_categories,
    };
  }

  // ── Case 4: nothing strong in the horizon → rest.
  // Find the next time demand recovers to moderate, just to give a hint.
  let recover: Date | null = null;
  for (let h = 1; h <= 12; h++) {
    const fh = (hour + h) % 24;
    if (curve[fh] >= MOD_DEMAND) {
      const t = new Date(now);
      t.setHours(fh, 0, 0, 0);
      if (fh <= hour) t.setDate(t.getDate() + 1);
      recover = t;
      break;
    }
  }

  return {
    status: 'low_demand',
    headline: 'Demand is quiet',
    message: recover
      ? `Few rides around for the next few hours. If you don't have to drive, rest — things pick up around ${fmt(recover)}.`
      : `Demand is low right now. Earnings are unlikely to cover your time and fuel.`,
    reason: 'low_demand_window',
    demandNow,
    minutesUntil: recover ? Math.round((recover.getTime() - now.getTime()) / 60000) : 0,
    windowStartsAt: recover ? fmt(recover) : undefined,
  };
}
