import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/server/redis';
import { runHarvest } from '@/lib/server/harvester';
import { rateLimit } from '@/lib/server/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const STALE_MS = 9 * 60 * 1000; // refresh if cached data is older than 9 min

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, { limit: 60, windowSec: 60, bucket: 'recs' });
  if (limited) return limited;

  const raw = await redis.get('live_recommendations');

  // Decide if we need a fresh harvest: nothing cached, or it's stale.
  let stale = true;
  if (raw) {
    try {
      const age = Date.now() - new Date(JSON.parse(raw).generatedAt).getTime();
      stale = age > STALE_MS;
    } catch {
      stale = true;
    }
  }

  if (stale) {
    try {
      const fresh = await runHarvest(); // runs traffic/weather/fuel + rescores
      return NextResponse.json(fresh);
    } catch (err: any) {
      // Harvest failed — fall back to cached data if we have any.
      if (raw) return NextResponse.json(JSON.parse(raw));
      return NextResponse.json({ message: 'Harvest failed', error: err.message }, { status: 503 });
    }
  }

  return NextResponse.json(JSON.parse(raw!));
}
