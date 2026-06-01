'use client';
import { weatherEmoji } from '@/lib/utils';
import clsx from 'clsx';

interface Props {
  main: string;
  description: string;
  penalty: number;
  compact?: boolean;
}

export function WeatherBadge({ main, description, penalty, compact }: Props) {
  const good = penalty >= 0.90;
  return (
    <div className={clsx(
      'flex items-center gap-2 rounded-lg border px-3 py-1.5',
      good ? 'border-success/20 bg-success/5' : 'border-warning/30 bg-warning/5',
    )}>
      <span className="text-lg leading-none">{weatherEmoji(main)}</span>
      {!compact && (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white capitalize">{description}</p>
          {penalty < 1 && (
            <p className="text-[10px] text-warning">−{Math.round((1 - penalty) * 100)}% efficiency</p>
          )}
        </div>
      )}
    </div>
  );
}
