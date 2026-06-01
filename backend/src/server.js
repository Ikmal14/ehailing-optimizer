'use strict';
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const cron     = require('node-cron');
const db       = require('./db');
const redis    = require('./redis');
const { runHarvest } = require('./harvester');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', ts: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// Live Data Endpoints (served from Redis)
// ────────────────────────────────────────────────────────────

// Primary dashboard payload — recommendations + top zones
app.get('/api/recommendations', async (req, res) => {
  const raw = await redis.get('live_recommendations');
  if (!raw) return res.status(202).json({ message: 'Harvester not yet run. Check back in 10s.' });
  res.json(JSON.parse(raw));
});

// All zones ranked by efficiency score
app.get('/api/zones/ranked', async (req, res) => {
  const raw = await redis.get('live_ranked_zones');
  if (!raw) return res.status(202).json({ message: 'Data pending.' });
  res.json(JSON.parse(raw));
});

// Single zone metric
app.get('/api/zones/:name', async (req, res) => {
  const raw = await redis.hget('live_zone_metrics', decodeURIComponent(req.params.name));
  if (!raw) return res.status(404).json({ message: 'Zone not found or not yet scored.' });
  res.json(JSON.parse(raw));
});

// All zone metrics as map
app.get('/api/zones', async (req, res) => {
  const raw = await redis.hgetall('live_zone_metrics');
  if (!raw) return res.status(202).json({ message: 'Data pending.' });
  const parsed = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, JSON.parse(v)]));
  res.json(parsed);
});

// ────────────────────────────────────────────────────────────
// Static DB Endpoints
// ────────────────────────────────────────────────────────────

app.get('/api/strategy-blocks', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM strategy_blocks ORDER BY day_type, start_time');
  res.json(rows);
});

app.get('/api/driver-params', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM driver_params WHERE id = 1');
  res.json(rows[0]);
});

app.patch('/api/driver-params', async (req, res) => {
  const { fuel_efficiency, fuel_price_myr, base_lat, base_lng, min_profit_threshold } = req.body;
  await db.query(
    `UPDATE driver_params SET
       fuel_efficiency        = COALESCE($1, fuel_efficiency),
       fuel_price_myr         = COALESCE($2, fuel_price_myr),
       base_lat               = COALESCE($3, base_lat),
       base_lng               = COALESCE($4, base_lng),
       min_profit_threshold   = COALESCE($5, min_profit_threshold),
       updated_at             = NOW()
     WHERE id = 1`,
    [fuel_efficiency, fuel_price_myr, base_lat, base_lng, min_profit_threshold]
  );
  res.json({ success: true });
});

app.get('/api/pois', async (req, res) => {
  const { category, zone } = req.query;
  let query = `
    SELECT p.id, p.name, p.category, z.name AS zone_name, p.lat, p.lng
    FROM pois p JOIN zones z ON p.zone_id = z.id
    WHERE 1=1
  `;
  const params = [];
  if (category) { params.push(category); query += ` AND p.category = $${params.length}`; }
  if (zone)     { params.push(zone);     query += ` AND z.name = $${params.length}`; }
  query += ' ORDER BY z.name, p.category, p.name';
  const { rows } = await db.query(query, params);
  res.json(rows);
});

// Manual harvest trigger (admin use)
app.post('/api/harvest/run', async (req, res) => {
  res.json({ message: 'Harvest triggered.', ts: new Date().toISOString() });
  runHarvest().catch(err => console.error('[Manual Harvest] Error:', err.message));
});

// ────────────────────────────────────────────────────────────
// Cron: every 10 minutes
// ────────────────────────────────────────────────────────────

cron.schedule('*/10 * * * *', () => {
  console.log('[Cron] Triggering harvest...');
  runHarvest().catch(err => console.error('[Cron] Harvest error:', err.message));
});

// ────────────────────────────────────────────────────────────
// Boot
// ────────────────────────────────────────────────────────────

async function boot() {
  // Redis: attempt connection but don't crash — harvester will retry on each cron tick
  try {
    await redis.connect();
  } catch (err) {
    console.warn('[Boot] Redis unavailable — will retry on next harvest:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    runHarvest().catch(err => console.error('[Boot Harvest] Error:', err.message));
  });
}

boot().catch((err) => {
  console.error('[Boot] Fatal:', err.message);
  process.exit(1);
});
