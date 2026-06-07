import { NextRequest, NextResponse } from 'next/server';
import { runHarvest } from '@/lib/server/harvester';
import { rateLimit, checkSecret } from '@/lib/server/guard';

export const runtime     = 'nodejs';
export const dynamic     = 'force-dynamic';
export const maxDuration = 30;

async function handle(req: NextRequest) {
  const limited = await rateLimit(req, { limit: 10, windowSec: 60, bucket: 'harvest' });
  if (limited) return limited;

  // Triggering a harvest hits paid external APIs and DB — require the shared
  // secret (sent by the GitHub cron and the owner's browser). Reads stay open;
  // /api/recommendations still refreshes data inline without a secret.
  const unauth = checkSecret(req);
  if (unauth) return unauth;

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
