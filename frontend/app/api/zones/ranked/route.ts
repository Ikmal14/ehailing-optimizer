import { NextResponse } from 'next/server';
import redis from '@/lib/server/redis';

export const runtime = 'nodejs';

export async function GET() {
  const raw = await redis.get('live_ranked_zones');
  if (!raw) return NextResponse.json({ message: 'Data pending.' }, { status: 202 });
  return NextResponse.json(JSON.parse(raw));
}
