'use client';
export const dynamic = 'force-dynamic';
import useSWR from 'swr';
import { useState } from 'react';
import { api, type ZoneMetric } from '@/lib/api';
import { ScoreRing } from '@/components/ScoreRing';
import { CongestionBar } from '@/components/CongestionBar';
import { categoryEmoji, scoreBg } from '@/lib/utils';
import clsx from 'clsx';

export default function ZonesPage() {
  const { data, isLoading, error } = useSWR<ZoneMetric[]>('ranked-zones', api.rankedZones, {
    refreshInterval: 60_000,
  });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'blacklisted'>('all');

  if (isLoading) return <div className="pt-8 text-center text-muted animate-pulse">Loading zones…</div>;
  if (error || !data)  return <div className="pt-8 text-center text-danger">Failed to load zones.</div>;

  const filtered = data.filter(z =>
    filter === 'all' ? true
    : filter === 'blacklisted' ? z.isBlacklisted
    : !z.isBlacklisted,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-white pt-2">🗺 Zone Intelligence</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-panel rounded-lg p-1 border border-border">
        {(['all', 'active', 'blacklisted'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx(
              'flex-1 text-xs py-1.5 rounded-md capitalize transition-all',
              filter === f
                ? 'bg-accent/20 text-accent font-semibold'
                : 'text-muted hover:text-white',
            )}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((z, i) => (
          <div key={z.zoneId}
            className={clsx(
              'rounded-xl border transition-all',
              z.isBlacklisted ? 'border-danger/20 bg-danger/5' : scoreBg(z.efficiencyScore),
            )}>
            {/* Row */}
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setExpanded(expanded === z.zoneId ? null : z.zoneId)}>
              <span className="text-muted text-xs w-4 shrink-0">{i + 1}</span>
              <ScoreRing score={z.efficiencyScore} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm truncate">{z.zoneName}</p>
                  {z.isBlacklisted && (
                    <span className="text-[10px] bg-danger/20 text-danger rounded px-1 shrink-0">⛔</span>
                  )}
                </div>
                <CongestionBar ratio={z.congestionRatio} speedKmh={z.currentSpeedKmh} />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted">{z.bearingLabel}</p>
                <p className="text-xs text-muted">{z.distanceKm} km</p>
                <p className="text-[10px] text-muted mt-0.5">{expanded === z.zoneId ? '▲' : '▼'}</p>
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === z.zoneId && (
              <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Speed', value: `${z.currentSpeedKmh} km/h` },
                    { label: 'Free Flow', value: `${z.freeFlowSpeedKmh} km/h` },
                    { label: 'Fuel Cost', value: `RM ${z.fuelCostMyr}` },
                  ].map(s => (
                    <div key={s.label} className="bg-surface rounded-lg p-2">
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {z.blacklistReason && (
                  <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
                    ⚠ {z.blacklistReason}
                  </p>
                )}

                {z.matchedPois.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-2 uppercase tracking-wide">Matched POIs</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {z.matchedPois.map((p, j) => (
                        <div key={j}
                          className="flex items-center gap-1.5 bg-border/30 rounded-md px-2 py-1">
                          <span>{categoryEmoji(p.category)}</span>
                          <span className="text-xs text-white/70 truncate">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
