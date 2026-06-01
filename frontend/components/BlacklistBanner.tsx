'use client';

interface Props { zones: string[] }

export function BlacklistBanner({ zones }: Props) {
  if (zones.length === 0) return null;
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⛔</span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-danger">
          Blacklisted Zones — Avoid Now
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {zones.map((z) => (
          <span key={z}
            className="text-xs font-mono bg-danger/10 border border-danger/20 text-danger rounded-md px-2.5 py-1">
            {z}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">
        Traffic delays reduce EfficiencyScore below profitability threshold.
      </p>
    </div>
  );
}
