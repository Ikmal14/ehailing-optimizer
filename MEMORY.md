# Project Memory — Strategic Shift Planner

Living notes for this codebase: what it is, how it's wired, decisions made, and gotchas.
(For the user-facing explanation see `README.md` and the in-app `/about` page.)

---

## What it is
A PWA for a single Klang Valley e-hailing driver that recommends **when** to go online,
**where** to drive, and **which zones to avoid**, scored in estimated **net RM/hour**.

- **Live app:** https://ehailing-optimizer.vercel.app
- **Repo:** https://github.com/Ikmal14/ehailing-optimizer

## Architecture (current)
- **Next.js 14 App Router at the repo root** (NOT in `frontend/` — moved to root to stop
  Vercel monorepo/output-dir confusion). `backend/` and `frontend/` are legacy and excluded
  via `.vercelignore`; `backend/db/init.sql` is still the schema seed of record.
- **API routes** in `app/api/**/route.ts` — all `runtime='nodejs'` + `dynamic='force-dynamic'`.
- **Server logic** in `lib/server/`: `harvester.ts` (orchestration), `score.ts` (earnings model),
  `startTime.ts` (go/wait/rest engine), `db.ts` (pg pool), `redis.ts` (ioredis).
- **DB:** Neon Postgres. **Cache:** Upstash Redis. **Hosting:** Vercel (Hobby).
- **Data sources:** TomTom Traffic Flow, OpenWeather, data.gov.my (fuel price).

## Data flow
`harvester.runHarvest()` loads zones/POIs/strategy/driver params → fetches live traffic
(per zone), weather (at driver base), fuel price → scores every zone → writes Redis keys
`live_zone_metrics` (hash), `live_recommendations`, `live_ranked_zones` (TTL 720s) → returns
the recommendations object.

## Scoring model (`lib/server/score.ts`)
Ranks by **net RM/hour ONLINE over the full driver cycle**, not just the paid trip:
`cycleTime = tripTime (profile base + traffic delay) + waitTime (30/demandIndex) + deadhead (6/congestionRatio)`,
`netPerHour = (grossFare − fuel on trip+deadhead) / cycleTime × 60`. KV tariff: base RM2, RM0.25/km,
RM0.43/min, fuel RM0.10/km. Rain/Thunderstorm → 2× surge. Score 0–100 (RM15/hr→0, RM65/hr→100);
below RM15/hr = blacklisted trap zone. **Key insight:** dividing by cycle time (not trip time) is
what makes quick back-to-back zones beat long-fare-but-idle zones — the anti-"sidai" core.

## Best Start Time (`lib/server/startTime.ts`)
Three verdicts: `go_now` / `wait` (until HH:MM) / `low_demand` (rest). Blends LIVE best-zone
net RM/hr (authoritative for now) with a static KV hourly **demand curve** (weekday/weekend) for
hours ahead, since free APIs give no future traffic. Returns `demandNow` 0–100.

## Decisions & gotchas (IMPORTANT)
- **Timezone:** Vercel runs UTC; Malaysia is UTC+8 no DST. Use `nowMYT()` in `harvester.ts`
  (`Date.now()+8h`, read via `getUTCHours/Day`); `startTime.ts` uses `getUTC*`/`setUTC*` and
  formats "HH:MM" via `toISOString().slice(11,16)`. Do NOT use local `getHours()` server-side.
- **PostGIS dropped:** local Postgres 18 had no PostGIS, so schema uses plain `lat`/`lng` numeric
  columns; all spatial math (haversine, bearing) is done in JS. Neon also has no PostGIS here.
- **Auto-refresh:** `/api/recommendations` re-runs the harvest INLINE when cached data is >9 min
  old (`STALE_MS`). This is the reliable freshness path — do not rely on cron timing for correctness.
- **Cron is best-effort backup:** `.github/workflows/harvest.yml` POSTs `/api/harvest/run` every
  10 min. Vercel Hobby blocks sub-daily cron, hence GitHub Actions. GH scheduled runs can be
  delayed and are disabled after 60 days of repo inactivity.
- **`/api/harvest/run` now requires the shared secret** (`checkSecret`). Callers must send
  `x-app-secret`: the browser sends it via `authHeaders()` (owner's access key from Settings),
  and the cron workflow sends `${{ secrets.CRON_SECRET }}`. **A GitHub Actions repo secret named
  `CRON_SECRET` (same value as the Vercel env var) MUST exist or the cron gets 401.** Inline
  refresh in `/api/recommendations` calls `runHarvest()` in-process (no HTTP), so it needs no secret.
- **`checkSecret` fails CLOSED:** no `APP_SECRET`/`CRON_SECRET` env → 503 (not open). Uses
  `timingSafeEqual`. Since `CRON_SECRET` is set on Vercel, live behaviour is unchanged.
- **Driver base is clamped to a Greater Klang Valley bbox** in `app/api/driver-params/route.ts`
  (`KV_LAT 2.6–3.5`, `KV_LNG 101.2–102.0`). Gotcha that prompted it: a stray GPS fix (or stale
  value) persisted a base at lat 4.0/lng 101.29 (Perak), making every zone read ~100 km away —
  it's straight-line haversine in **km**, not a miles bug. Default base = PJ `3.1073, 101.6369`.
- **Harvest lock TTL is 60s** (was 45s) — must exceed function `maxDuration` (30s) so it can't
  expire mid-harvest and let a second harvest double-hit TomTom.
- **Theme:** colours are CSS variables (RGB-channel triplets) in `globals.css`; Tailwind maps
  `surface/panel/border/content/muted` to `rgb(var(--x) / <alpha>)`. Use `text-content` NOT
  `text-white` (white doesn't flip in light mode). `.light` class on `<html>`; no-flash init
  script in `app/layout.tsx`; toggle via `components/ThemeToggle.tsx` (localStorage `theme`).
- **Location:** `components/LocationSync.tsx` reads device GPS on dashboard load, PATCHes driver
  base_lat/lng, re-harvests. Re-syncs at most every 30 min (localStorage `geo_synced_at`).
- **Fuel/BUDI95:** data.gov.my `fuelprice` dataset (no key). Headline price shown is **BUDI95
  RM1.99** (subsidised RON95 for eligible Malaysians) — what the driver actually pays.
- **Units:** everything SI/metric — km, km/h, °C, RM, mm/h. Humidity intentionally NOT shown
  (Malaysia is always humid → not actionable).

## Local dev / deploy notes
- Node/npm not on a clean PATH sometimes; npm blocked by PS exec policy. Workaround used:
  `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" <cmd>` and same for `npx-cli.js`.
- Deploy: `npx vercel --prod` from repo root (project linked via `.vercel/`). Vercel project
  Output Directory / Root Directory must be BLANK (app is at root). Env vars set on Vercel:
  `DATABASE_URL`, `REDIS_URL`, `TOMTOM_API_KEY`, `OPENWEATHER_API_KEY`, `CRON_SECRET`.
- Seed DB: `psql "$DATABASE_URL" -f backend/db/init.sql` (use Neon NON-pooler host for the seed;
  the pooler drops long DDL connections).

## Open / future
- Confirm GitHub Actions cron is actually firing in the Actions tab (timing unreliable).
- Scoring is estimate-only (no historical ride DB); demand curve is a hand-tuned prior.
