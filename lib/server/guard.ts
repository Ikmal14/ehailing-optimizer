import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import redis from './redis';

// ── Rate limiting (Redis fixed window, per IP) ───────────────────────────────
export async function rateLimit(
  req: NextRequest,
  opts: { limit: number; windowSec: number; bucket: string },
): Promise<NextResponse | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const key = `rl:${opts.bucket}:${ip}`;
  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, opts.windowSec);
    if (n > opts.limit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Slow down.' },
        { status: 429, headers: { 'Retry-After': String(opts.windowSec) } },
      );
    }
  } catch {
    // If Redis is unreachable, fail open (don't block legitimate use).
  }
  return null;
}

// ── Shared-secret check for mutating endpoints ───────────────────────────────
// Single-user app: the browser stores APP_SECRET (set once in Settings) and the
// GitHub cron sends it as a header. Reads stay open; writes/triggers require it.
export function checkSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.APP_SECRET || process.env.CRON_SECRET;
  // Fail CLOSED: a missing secret is a misconfiguration, not a reason to expose
  // mutating endpoints to the world. Reject rather than silently allow.
  if (!expected) {
    console.error('[guard] No APP_SECRET/CRON_SECRET configured — refusing request.');
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }
  const provided =
    req.headers.get('x-app-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  // Constant-time comparison to avoid leaking the secret via timing.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// ── Harvest debounce (caps external API cost regardless of caller) ───────────
// Returns true if a real harvest is allowed now; false if one ran too recently.
// TTL must exceed the function's maxDuration (30s) so the lock can't expire
// mid-harvest and let a second harvest double-hit the external APIs.
export async function acquireHarvestLock(minIntervalSec = 60): Promise<boolean> {
  try {
    // SET key only if not exists, with TTL — atomic debounce.
    const ok = await redis.set('harvest_lock', '1', 'EX', minIntervalSec, 'NX');
    return ok === 'OK';
  } catch {
    return true; // Redis down → allow (fail open)
  }
}
