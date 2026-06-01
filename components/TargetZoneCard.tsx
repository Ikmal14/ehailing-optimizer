'use client';
import type { TargetZone } from '@/lib/api';
import { ScoreRing } from './ScoreRing';
import { categoryEmoji } from '@/lib/utils';

interface Props { zone: TargetZone }

export function TargetZoneCard({ zone }: Props) {
  return (
    <div className="rounded-xl border border-success/40 bg-success/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
          My Destination Target
        </h2>
      </div>

      <div className="flex items-start gap-4">
        <ScoreRing score={zone.efficiencyScore} size={80} />
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black text-white leading-tight">{zone.name}</p>
          <p className="text-sm text-success font-mono mt-0.5">
            {zone.direction}
          </p>
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <span>{zone.distanceKm} km away</span>
            <span>RM {zone.fuelCostMyr} fuel</span>
            <span>{zone.speedKmh} km/h</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40 pt-3">
        <p className="text-xs text-muted mb-2 uppercase tracking-wide">Active POIs</p>
        <div className="grid grid-cols-2 gap-1.5">
          {zone.matchedPois.slice(0, 6).map((poi, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-border/30 rounded-md px-2 py-1">
              <span className="text-sm">{categoryEmoji(poi.category)}</span>
              <span className="text-xs text-white/70 truncate">{poi.name}</span>
            </div>
          ))}
          {zone.matchedPois.length > 6 && (
            <div className="flex items-center gap-1.5 bg-border/30 rounded-md px-2 py-1">
              <span className="text-xs text-muted">+{zone.matchedPois.length - 6} more</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
