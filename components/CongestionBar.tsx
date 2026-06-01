'use client';
import { congestionLabel, congestionColor } from '@/lib/utils';
import clsx from 'clsx';

interface Props { ratio: number; speedKmh?: number }

export function CongestionBar({ ratio, speedKmh }: Props) {
  const pct   = Math.round(ratio * 100);
  const label = congestionLabel(ratio);
  const color = congestionColor(ratio);

  const barColor =
    ratio >= 0.80 ? 'bg-success'
    : ratio >= 0.60 ? 'bg-warning'
    : ratio >= 0.40 ? 'bg-orange-400'
    : 'bg-danger';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={clsx('font-semibold', color)}>{label}</span>
        <span className="text-muted">{speedKmh ? `${speedKmh} km/h` : `${pct}%`}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
