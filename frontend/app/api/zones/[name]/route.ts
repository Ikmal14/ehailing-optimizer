import { NextResponse } from 'next/server';
import redis from '@/lib/server/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { name: string } }) {
  const raw = await redis.hget('live_zone_metrics', decodeURIComponent(params.name));
  if (!raw) return NextResponse.json({ message: 'Zone not found.' }, { status: 404 });
  return NextResponse.json(JSON.parse(raw));
}
