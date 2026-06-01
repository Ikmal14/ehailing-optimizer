# ⚡ Strategic Shift Planner

**Your co-pilot for working smarter, not longer.**

A Progressive Web App for Klang Valley e-hailing drivers that answers the three questions that decide your earnings: **when** to start, **where** to go, and **which areas to avoid** — so you spend your time earning instead of waiting (no more *“sidai”*).

🔗 **Live app:** https://ehailing-optimizer.vercel.app

---

## The problem

Driving for e-hailing is a guessing game. You log on and hope you picked a good spot at a good time. Some hours are gold; others you burn fuel circling for a single ride. Demand shifts by the hour, traffic turns a “busy” area into a trap, and rain flips the whole map — but you can’t see any of that from the driver’s seat.

## What it does

The Strategic Shift Planner watches **live traffic and weather** across the Klang Valley and works out, in plain ringgit, which area is paying best **right now**.

| Feature | What it gives you |
|---|---|
| ⏰ **Best Start Time** | The exact time to flip online so you arrive as demand peaks — not 40 minutes early burning fuel. |
| 🎯 **My Destination Target** | The single best zone to drive to right now, plus the direction to head and POIs that are active. |
| ⛔ **Blacklist / Trap Zones** | Areas that look busy but trap you in traffic for little reward — flagged so you don’t chase them. |
| 🌧️ **Weather-aware** | Rain and storms boost demand and fares; every recommendation accounts for live weather. |
| 💸 **Real money, not vague scores** | Every zone is rated by estimated **net ringgit per hour** after fuel. |

## How the score works

Each zone gets a **0–100 earnings score** answering one question: *“If I work this area now, roughly how much will I take home per hour?”*

What makes it honest is that it counts your **whole working cycle**, not just the paid trip:

```
Score ≈ money earned ÷ total time
        (waiting for a ride + driving empty to pickup + the paid trip)
```

The fare model uses realistic Klang Valley rates (base fare, per-km, per-minute), subtracts fuel cost, and applies a surge multiplier in rain/storms. Crucially, it divides earnings by the **full cycle time** — so a humble spot doing quick back-to-back rides can rightly out-score a fancy long-fare area that leaves you idle between trips. Zones that can’t clear a minimum profit-per-hour floor are flagged as trap zones.

### Reading the colours

| Score | Meaning |
|---|---|
| 🟢 **70–100** | Strong earner — head here |
| 🟡 **40–69** | Decent — worth it if nearby |
| 🟠 **1–39** | Weak — only if you’re already there |
| 🔴 **0 / Blacklisted** | Trap zone — avoid |

> Earnings figures are **estimates to compare zones against each other** — not a guarantee of any single fare. The app suggests; you decide.

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS — installable PWA, mobile-first
- **API:** Next.js Route Handlers (serverless)
- **Database:** PostgreSQL (Neon) — zones, POIs, strategy blocks, driver params
- **Cache:** Redis (Upstash) — live zone metrics and recommendations
- **Data sources:** TomTom Traffic Flow API + OpenWeather API
- **Harvester:** runs every 10 minutes, scores all zones, writes the cache
- **Hosting:** Vercel; scheduled refresh via external cron

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (.env.local)
DATABASE_URL=postgresql://...        # Neon or local Postgres
REDIS_URL=rediss://...               # Upstash or local Redis
TOMTOM_API_KEY=...                   # https://developer.tomtom.com (Traffic Flow)
OPENWEATHER_API_KEY=...              # https://openweathermap.org/api

# 3. Seed the database
psql "$DATABASE_URL" -f backend/db/init.sql

# 4. Start
npm run dev          # → http://localhost:3000

# 5. Populate the cache
curl -X POST http://localhost:3000/api/harvest/run
```

## Project layout

```
app/            Next.js pages (dashboard, zones, about, settings) + API routes
components/     Dashboard UI components
lib/api.ts      Typed client for the API
lib/server/     Harvester, scoring engine, DB + Redis clients
backend/        Schema seed (db/init.sql) and original standalone Express server
```

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/recommendations` | Primary dashboard payload |
| `GET`  | `/api/zones/ranked` | All zones ranked by score |
| `GET`  | `/api/zones/:name` | Single zone detail |
| `GET`  | `/api/driver-params` | Vehicle/base config |
| `PATCH`| `/api/driver-params` | Update vehicle/base config |
| `POST` | `/api/harvest/run` | Trigger a harvest (used by cron) |

---

*Built for Klang Valley drivers. Drive safe, earn smart.*
