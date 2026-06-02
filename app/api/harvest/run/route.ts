import { NextRequest, NextResponse } from 'next/server';
import { runHarvest } from '@/lib/server/harvester';
import { rateLimit } from '@/lib/server/guard';

export const runtime     = 'nodejs';
export const dynamic     = 'force-dynamic';
export const maxDuration = 30;

async function handle(req: NextRequest) {
  // Rate limit + the 45s harvest debounce inside runHarvest together cap
  // external API usage, so this can stay open (the GitHub cron uses it).
  const limited = await rateLimit(req, { limit: 10, windowSec: 60, bucket: 'harvest' });
  if (limited) return limited;

  try {
    const result = await runHarvest();
    return NextResponse.json({ success: true, targetZone: result.targetZone?.name, ts: result.generatedAt });
  } catch (err: any) {
    console.error('[Harvest] Error:', err.message);
    return NextResponse.json({ error: 'Harvest failed' }, { status: 500 });
  }
}

export const POST = handle;
export const GET  = handle; // cron may call GET
