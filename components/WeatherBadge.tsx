'use client';
import { weatherEmoji } from '@/lib/utils';
import clsx from 'clsx';

interface Props {
  main: string;
  description: string;
  penalty: number;
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  rainMm?: number;
  compact?: boolean;
}

export function WeatherBadge({
  main, description, penalty, tempC, feelsLikeC, humidity, windKmh, rainMm, compact,
}: Props) {
  const wet  = main === 'Rain' || main === 'Thunderstorm' || (rainMm ?? 0) > 0;
  const good = !wet;

  // Compact: just emoji + temp (for the header).
  if (compact) {
    return (
      <div className={clsx(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5',
        good ? 'border-success/20 bg-success/5' : 'border-warning/30 bg-warning/5',
      )}>
        <span className="text-base leading-none">{weatherEmoji(main)}</span>
        {tempC != null && <span className="text-xs font-bold text-white">{tempC}°C</span>}
      </div>
    );
  }

  return (
    <div className={clsx(
      'rounded-lg border px-3 py-2.5 space-y-2',
      good ? 'border-success/20 bg-success/5' : 'border-warning/30 bg-warning/5',
    )}>
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{weatherEmoji(main)}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">
            {tempC != null ? `${tempC}°C` : main}
            <span className="text-xs font-normal text-muted capitalize"> · {description}</span>
          </p>
          {feelsLikeC != null && (
            <p className="text-[10px] text-muted">feels like {feelsLikeC}°C</p>
          )}
        </div>
      </div>

      {/* Metric chips */}
      <div className="flex flex-wrap gap-1.5">
        {(rainMm ?? 0) > 0 && (
          <Chip icon="🌧" label={`${rainMm} mm/h`} tone="warn" />
        )}
        {windKmh != null && <Chip icon="💨" label={`${windKmh} km/h`} />}
        {humidity != null && <Chip icon="💧" label={`${humidity}%`} />}
      </div>

      {/* Driver-relevant insight */}
      {wet ? (
        <p className="text-[11px] text-warning font-semibold">
          ⚡ Wet weather — demand & surge up. Fares boosted 2×.
        </p>
      ) : (
        <p className="text-[11px] text-success">Clear conditions — normal demand.</p>
      )}
    </div>
  );
}

function Chip({ icon, label, tone }: { icon: string; label: string; tone?: 'warn' }) {
  return (
    <span className={clsx(
      'text-[10px] rounded-md px-2 py-0.5 border',
      tone === 'warn'
        ? 'border-warning/30 bg-warning/10 text-warning'
        : 'border-border bg-border/30 text-white/70',
    )}>
      {icon} {label}
    </span>
  );
}
