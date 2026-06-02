'use client';
export const dynamic = 'force-dynamic';
import useSWR from 'swr';
import { api, type Recommendations } from '@/lib/api';
import { StartTimeCard } from '@/components/StartTimeCard';
import { TargetZoneCard } from '@/components/TargetZoneCard';
import { BlacklistBanner } from '@/components/BlacklistBanner';
import { TopZonesTable } from '@/components/TopZonesTable';
import { WeatherBadge } from '@/components/WeatherBadge';
import { FuelPriceCard } from '@/components/FuelPriceCard';
import { LocationSync } from '@/components/LocationSync';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshButton } from '@/components/RefreshButton';
import { relativeTime } from '@/lib/utils';

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<Recommendations>(
    'recommendations',
    api.recommendations,
    {
      refreshInterval: 120_000,   // data changes ~every 10 min; poll lightly
      dedupingInterval: 60_000,   // collapse duplicate requests
      keepPreviousData: true,     // no flicker on refresh
      revalidateOnFocus: false,   // don't re-hit the API on every tab focus
      onError: () => {
        api.triggerHarvest().then(() => setTimeout(() => mutate(), 5000));
      },
    },
  );

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-4xl">📡</p>
        <p className="text-content font-semibold">Backend offline or data pending</p>
        <p className="text-muted text-xs">Start the backend server, then refresh.</p>
        <button onClick={() => mutate()}
          className="text-xs px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-lg font-black text-content tracking-tight">⚡ Shift Planner</h1>
          <p className="text-xs text-muted capitalize">{data.dayType} mode · {relativeTime(data.generatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <WeatherBadge {...data.weather} compact />
          <ThemeToggle />
          <RefreshButton onRefresh={() => mutate()} />
        </div>
      </div>

      {/* Auto location sync */}
      <LocationSync onSynced={() => mutate()} />

      {/* Active block pills */}
      <div className="flex gap-1.5 flex-wrap">
        {data.activeBlocks.map((b) => (
          <span key={b.label}
            className="text-[10px] bg-accent/10 border border-accent/20 text-accent rounded-full px-2.5 py-0.5">
            {b.label} · {b.start}–{b.end}
          </span>
        ))}
      </div>

      {/* Best start time */}
      <StartTimeCard data={data.bestStartTime} />

      {/* Target zone */}
      {data.targetZone
        ? <TargetZoneCard zone={data.targetZone} />
        : (
          <div className="rounded-xl border border-border bg-panel p-4 text-center">
            <p className="text-muted text-sm">No profitable zone found for current conditions.</p>
          </div>
        )
      }

      {/* Weather detail */}
      <WeatherBadge {...data.weather} />

      {/* Fuel price */}
      {data.fuelPrice && <FuelPriceCard fuel={data.fuelPrice} />}

      {/* Blacklist */}
      <BlacklistBanner zones={data.blacklistedZones} />

      {/* Zone rankings */}
      <TopZonesTable zones={data.topZones} />

      <p className="text-center text-[10px] text-muted pb-2">
        Auto-updates every 10 min · Traffic: TomTom · Weather: OpenWeather · Fuel: data.gov.my
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      <div className="h-8 bg-panel rounded-lg w-48" />
      <div className="h-32 bg-panel rounded-xl" />
      <div className="h-48 bg-panel rounded-xl" />
      <div className="h-24 bg-panel rounded-xl" />
      <div className="h-64 bg-panel rounded-xl" />
    </div>
  );
}
