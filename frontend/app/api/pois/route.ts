import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const zone     = searchParams.get('zone');

  let query  = 'SELECT p.id, p.name, p.category, z.name AS zone_name, p.lat, p.lng FROM pois p JOIN zones z ON p.zone_id = z.id WHERE 1=1';
  const params: string[] = [];
  if (category) { params.push(category); query += ` AND p.category = $${params.length}`; }
  if (zone)     { params.push(zone);     query += ` AND z.name = $${params.length}`; }
  query += ' ORDER BY z.name, p.category, p.name';

  const { rows } = await pool.query(query, params);
  return NextResponse.json(rows);
}
