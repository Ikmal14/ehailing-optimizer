'use client';
import type { BestStartTime } from '@/lib/api';
import { categoryEmoji } from '@/lib/utils';
import clsx from 'clsx';

interface Props { data: BestStartTime }

const STYLES = {
  go_now:     { border: 'border-success/40 bg-success/5', dot: 'bg-success', accent: 'text-success' },
  wait:       { border: 'border-accent/30 bg-accent/5',   dot: 'bg-accent',  accent: 'text-accent' },
  low_demand: { border: 'border-muted/30 bg-panel',       dot: 'bg-muted',   accent: 'text-muted' },
} as const;

export function StartTimeCard({ data }: Props) {
  const s = STYLES[data.status] ?? STYLES.wait;
  const showClock = data.status === 'wait' && !!data.goOnlineAt;

  return (
    <div className={clsx('rounded-xl border p-4 space-y-3', s.border)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={clsx('h-2 w-2 rounded-full animate-pulse-slow', s.dot)} />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Best Start Time
          </h2>
        </div>
        <span className="text-[10px] text-muted">demand {data.demandNow}/100</span>
      </div>

      <div className="text-center py-2">
        {showClock ? (
          <>
            <p className={clsx('text-5xl font-black tracking-tight', s.accent)}>
              {data.goOnlineAt}
            </p>
            {data.minutesUntil > 0 && (
              <p className="text-xs text-muted mt-1">in {formatWait(data.minutesUntil)}</p>
            )}
          </>
        ) : (
          <p className={clsx('text-3xl font-black', s.accent)}>{data.headline}</p>
        )}
      </div>

      <p className="text-xs text-content/70 leading-relaxed border-t border-border/40 pt-3">
        {data.message}
      </p>

      {/* Demand bar */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700',
            data.demandNow >= 70 ? 'bg-success' : data.demandNow >= 50 ? 'bg-warning' : 'bg-muted',
          )}
          style={{ width: `${data.demandNow}%` }}
        />
      </div>

      {data.targetCategories && data.targetCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.targetCategories.map((cat) => (
            <span key={cat}
              className="text-xs bg-border/60 rounded-md px-2 py-0.5 text-content/60">
              {categoryEmoji(cat)} {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatWait(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
