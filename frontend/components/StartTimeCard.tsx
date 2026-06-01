'use client';
import type { BestStartTime } from '@/lib/api';
import { categoryEmoji } from '@/lib/utils';
import clsx from 'clsx';

interface Props { data: BestStartTime }

export function StartTimeCard({ data }: Props) {
  const isNow = (data.minutesUntil ?? 0) === 0;

  return (
    <div className={clsx(
      'rounded-xl border p-4 space-y-3',
      isNow
        ? 'border-success/40 bg-success/5'
        : 'border-accent/30 bg-accent/5',
    )}>
      <div className="flex items-center gap-2">
        <div className={clsx(
          'h-2 w-2 rounded-full animate-pulse-slow',
          isNow ? 'bg-success' : 'bg-accent',
        )} />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
          Best Start Time
        </h2>
      </div>

      {isNow ? (
        <div className="text-center py-2">
          <p className="text-3xl font-black text-success">GO ONLINE NOW</p>
          <p className="text-xs text-muted mt-1">Active surge window</p>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-5xl font-black text-accent tracking-tight">
            {data.goOnlineAt}
          </p>
          <p className="text-xs text-muted mt-1">
            {data.minutesUntil}m until "{data.label}" surge
          </p>
        </div>
      )}

      <p className="text-xs text-white/70 leading-relaxed border-t border-border/40 pt-3">
        {data.message}
      </p>

      {data.targetCategories && (
        <div className="flex flex-wrap gap-1.5">
          {data.targetCategories.map(cat => (
            <span key={cat}
              className="text-xs bg-border/60 rounded-md px-2 py-0.5 text-white/60">
              {categoryEmoji(cat)} {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
