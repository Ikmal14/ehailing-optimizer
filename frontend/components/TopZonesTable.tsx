'use client';
import type { TopZone } from '@/lib/api';
import { ScoreRing } from './ScoreRing';
import { CongestionBar } from './CongestionBar';
import clsx from 'clsx';

interface Props { zones: TopZone[] }

export function TopZonesTable({ zones }: Props) {
  return (
    <div className="rounded-xl border border-border bg-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Zone Rankings</h2>
        <span className="text-xs text-muted">{zones.length} zones</span>
      </div>
      <div className="divide-y divide-border">
        {zones.map((z, i) => (
          <div key={z.name}
            className={clsx(
              'flex items-center gap-3 px-4 py-3',
              z.blacklisted && 'opacity-40',
            )}>
            <span className="text-muted text-xs w-4 shrink-0">{i + 1}</span>
            <ScoreRing score={z.score} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{z.name}</p>
                {z.blacklisted && (
                  <span className="text-[10px] bg-danger/20 text-danger rounded px-1.5 py-0.5 shrink-0">
                    BLACKLISTED
                  </span>
                )}
              </div>
              <div className="mt-1">
                <CongestionBar ratio={z.congestion} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted">{z.direction}</p>
              <p className="text-xs text-muted">{z.distanceKm} km</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
