'use client';
import type { FuelPrice } from '@/lib/api';

interface Props { fuel: FuelPrice }

export function FuelPriceCard({ fuel }: Props) {
  const others = [
    { label: 'RON95', value: fuel.ron95, hint: 'market' },
    { label: 'RON97', value: fuel.ron97 },
    { label: 'Diesel', value: fuel.diesel },
  ];
  return (
    <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">⛽ Fuel Price (MY)</h2>
        <span className="text-[10px] text-muted">
          {fuel.date ? `wk of ${fuel.date}` : 'est.'}
        </span>
      </div>

      {/* BUDI95 — what an eligible driver actually pays */}
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2">
        <div>
          <p className="text-sm font-black text-success">BUDI95</p>
          <p className="text-[10px] text-muted">Subsidised RON95 · eligible Malaysians</p>
        </div>
        <p className="text-xl font-black text-success font-mono">RM{fuel.budi95.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {others.map((i) => (
          <div key={i.label} className="bg-surface rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted">{i.label}{i.hint ? ` · ${i.hint}` : ''}</p>
            <p className="text-sm font-black text-white font-mono">RM{i.value.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
