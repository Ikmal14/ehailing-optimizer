import { NextRequest, NextResponse } from 'next/server';
import { runHarvest } from '@/lib/server/harvester';

export const runtime  = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Protect cron endpoint with Vercel's auto-injected header
  const authHeader = req.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runHarvest();
    return NextResponse.json({ success: true, targetZone: result.targetZone?.name, ts: result.generatedAt });
  } catch (err: any) {
    console.error('[Harvest] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Vercel Cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
