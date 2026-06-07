import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/server/db';
import { rateLimit, checkSecret } from '@/lib/server/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM driver_params WHERE id = 1');
  return NextResponse.json(rows[0]);
}

// Validate + clamp a numeric field to a sane range; null if absent/invalid.
function num(v: unknown, min: number, max: number): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

// Greater Klang Valley bounding box (Sepang/KLIA → Rawang, Klang → Semenyih).
// The driver base MUST stay inside this — a stray GPS fix from elsewhere would
// otherwise persist a base 100+ km away and wreck every distance/fuel estimate.
const KV_LAT = { min: 2.6, max: 3.5 };
const KV_LNG = { min: 101.2, max: 102.0 };

export async function PATCH(req: NextRequest) {
  const limited = await rateLimit(req, { limit: 20, windowSec: 60, bucket: 'driver' });
  if (limited) return limited;

  const unauth = checkSecret(req);
  if (unauth) return unauth;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); }

  const fuel_efficiency      = num(body.fuel_efficiency, 1, 100);
  const fuel_price_myr        = num(body.fuel_price_myr, 0, 20);
  const base_lat             = num(body.base_lat, KV_LAT.min, KV_LAT.max);
  const base_lng             = num(body.base_lng, KV_LNG.min, KV_LNG.max);
  const min_profit_threshold = num(body.min_profit_threshold, 0, 1000);

  await pool.query(
    `UPDATE driver_params SET
       fuel_efficiency      = COALESCE($1, fuel_efficiency),
       fuel_price_myr       = COALESCE($2, fuel_price_myr),
       base_lat             = COALESCE($3, base_lat),
       base_lng             = COALESCE($4, base_lng),
       min_profit_threshold = COALESCE($5, min_profit_threshold),
       updated_at           = NOW()
     WHERE id = 1`,
    [fuel_efficiency, fuel_price_myr, base_lat, base_lng, min_profit_threshold]
  );
  return NextResponse.json({ success: true });
}
