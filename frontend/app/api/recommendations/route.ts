import { NextResponse } from 'next/server';
import redis from '@/lib/server/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const raw = await redis.get('live_recommendations');
  if (!raw) return NextResponse.json({ message: 'Harvester not yet run.' }, { status: 202 });
  return NextResponse.json(JSON.parse(raw));
}
