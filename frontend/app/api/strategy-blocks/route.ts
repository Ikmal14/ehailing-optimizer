import { NextResponse } from 'next/server';
import pool from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM strategy_blocks ORDER BY day_type, start_time');
  return NextResponse.json(rows);
}
