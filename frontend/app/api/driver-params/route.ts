import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM driver_params WHERE id = 1');
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest) {
  const { fuel_efficiency, fuel_price_myr, base_lat, base_lng, min_profit_threshold } = await req.json();
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
