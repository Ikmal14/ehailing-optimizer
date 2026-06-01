'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api, type DriverParams } from '@/lib/api';

export default function SettingsPage() {
  const { data, mutate } = useSWR<DriverParams>('driver-params', api.driverParams);
  const [form, setForm] = useState<Partial<DriverParams>>({});
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function field(key: keyof DriverParams, label: string, unit: string, step = '0.01') {
    return (
      <div className="space-y-1">
        <label className="text-xs text-muted uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
          <input
            type="number"
            step={step}
            value={form[key] ?? ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
          />
          <span className="text-muted text-xs shrink-0">{unit}</span>
        </div>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    await api.updateDriver(form).catch(() => null);
    await mutate();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-lg font-black text-white">⚙️ Driver Settings</h1>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <p className="text-xs text-muted uppercase tracking-widest">Vehicle</p>
        {field('fuel_efficiency', 'Fuel Efficiency', 'km/l', '0.1')}
        {field('fuel_price_myr', 'Fuel Price (RON95)', 'MYR/l', '0.001')}
        {field('min_profit_threshold', 'Min Profit Threshold', 'MYR', '0.50')}
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <p className="text-xs text-muted uppercase tracking-widest">Home Base (GPS)</p>
        {field('base_lat', 'Latitude', '°', '0.0001')}
        {field('base_lng', 'Longitude', '°', '0.0001')}
        <p className="text-[10px] text-muted">
          Default: Petaling Jaya (3.1073, 101.6369). Change to your actual starting location.
        </p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all
                   bg-accent/20 border border-accent/40 text-accent
                   hover:bg-accent/30 disabled:opacity-40">
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
      </button>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-2">
        <p className="text-xs text-muted uppercase tracking-widest mb-3">Strategy Reference</p>
        {[
          { time: '05:00–08:00', cats: 'residential, transit',    day: 'Weekday' },
          { time: '08:00–10:00', cats: 'hospital, university',    day: 'Weekday' },
          { time: '12:00–14:00', cats: 'office, mall',            day: 'Weekday' },
          { time: '16:00–20:00', cats: 'office, transit',         day: 'Weekday ⚠ Peak' },
          { time: '12:00–22:00', cats: 'mall, park, tourist',     day: 'Weekend' },
        ].map(r => (
          <div key={r.time} className="flex justify-between items-start text-xs border-b border-border/40 pb-2">
            <span className="font-mono text-accent">{r.time}</span>
            <span className="text-white/60 text-right">{r.cats}</span>
            <span className="text-muted text-right w-24 shrink-0">{r.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
