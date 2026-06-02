'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api, type DriverParams, getAccessKey, setAccessKey } from '@/lib/api';
import { getCurrentPosition } from '@/lib/geo';

export default function SettingsPage() {
  const { data, mutate } = useSWR<DriverParams>('driver-params', api.driverParams);
  const [form, setForm]     = useState<Partial<DriverParams>>({});
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [accessKey, setKey] = useState('');

  useEffect(() => { if (data) setForm(data); }, [data]);
  useEffect(() => { setKey(getAccessKey()); }, []);

  function field(key: keyof DriverParams, label: string, unit: string, help: string, step = '0.01') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-content">{label}</label>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
          <input
            type="number" step={step}
            value={form[key] ?? ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="flex-1 bg-transparent text-content text-sm outline-none font-mono"
          />
          <span className="text-muted text-xs shrink-0">{unit}</span>
        </div>
        <p className="text-[10px] text-muted leading-snug">{help}</p>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    await api.updateDriver(form).catch(() => null);
    await api.triggerHarvest().catch(() => null);
    await mutate();
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function useMyLocation() {
    setLocating(true); setLocMsg(null);
    try {
      const pos = await getCurrentPosition();
      setForm(f => ({ ...f, base_lat: pos.lat.toFixed(6), base_lng: pos.lng.toFixed(6) }));
      setLocMsg('📍 Location captured — tap Save to apply.');
    } catch (e: any) {
      setLocMsg(e?.code === 1 ? 'Location permission denied.' : 'Could not get location.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="text-lg font-black text-content">⚙️ Driver Settings</h1>
        <p className="text-xs text-muted mt-1">
          These personalise the earnings math to <strong>your</strong> vehicle and starting point.
          Every recommendation — net RM/hr, fuel cost, best zone direction — is computed from these.
        </p>
      </div>

      {/* Access key — required to save changes (owner only) */}
      <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">🔒 Access Key</p>
          <p className="text-[10px] text-muted mt-1">
            Required to save settings on your account. This is your <code>CRON_SECRET</code> —
            entered once and stored only on this device.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
          <input
            type="password"
            value={accessKey}
            onChange={e => { setKey(e.target.value); setAccessKey(e.target.value); }}
            placeholder="Enter access key"
            className="flex-1 bg-transparent text-content text-sm outline-none font-mono"
          />
        </div>
      </div>

      {/* Starting location */}
      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Your Starting Point</p>
          <p className="text-[10px] text-muted mt-1">
            Used to measure distance, direction & fuel to each zone. Set it to where you are now.
          </p>
        </div>

        <button
          onClick={useMyLocation}
          disabled={locating}
          className="w-full py-2.5 rounded-lg font-semibold text-sm
                     bg-accent/15 border border-accent/40 text-accent
                     hover:bg-accent/25 disabled:opacity-40">
          {locating ? 'Locating…' : '📍 Use My Current Location'}
        </button>
        {locMsg && <p className="text-[11px] text-content/70 text-center">{locMsg}</p>}

        <div className="grid grid-cols-2 gap-3">
          {field('base_lat', 'Latitude', '°', 'North–south position.', '0.000001')}
          {field('base_lng', 'Longitude', '°', 'East–west position.', '0.000001')}
        </div>
      </div>

      {/* Vehicle economics */}
      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Vehicle Economics</p>

        {field('fuel_efficiency', 'Fuel Efficiency', 'km/l',
          'Your car’s real consumption. Higher = lower fuel cost per trip = more zones stay profitable. (Perodua Bezza ≈ 22.)', '0.1')}

        <div className="space-y-1">
          {field('fuel_price_myr', 'Fuel Price', 'RM/l',
            'What you actually pay per litre. Drives the fuel cost subtracted from every fare.', '0.01')}
          <button
            onClick={() => setForm(f => ({ ...f, fuel_price_myr: '1.99' }))}
            className="text-[11px] text-success underline">
            Use BUDI95 rate (RM1.99)
          </button>
        </div>

        {field('min_profit_threshold', 'Min Profit Threshold', 'RM',
          'Your floor for a worthwhile job. Zones below this get flagged as trap zones.', '0.50')}
      </div>

      <button
        onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all
                   bg-accent/20 border border-accent/40 text-accent
                   hover:bg-accent/30 disabled:opacity-40">
        {saving ? 'Saving & recalculating…' : saved ? '✓ Saved!' : 'Save & Recalculate'}
      </button>

      {/* Strategy reference */}
      <div className="rounded-xl border border-border bg-panel p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">When Demand Peaks</p>
        {[
          { time: '07:00–09:00', cats: 'residential, transit', day: 'Weekday ⚠ Peak' },
          { time: '08:00–10:00', cats: 'hospital, university', day: 'Weekday' },
          { time: '12:00–14:00', cats: 'office, mall',         day: 'Weekday' },
          { time: '17:00–20:00', cats: 'office, transit',      day: 'Weekday ⚠ Peak' },
          { time: '12:00–22:00', cats: 'mall, park, tourist',  day: 'Weekend' },
        ].map(r => (
          <div key={r.time} className="flex justify-between items-start text-xs border-b border-border/40 pb-2">
            <span className="font-mono text-accent">{r.time}</span>
            <span className="text-content/60 text-right flex-1 px-2">{r.cats}</span>
            <span className="text-muted text-right w-20 shrink-0">{r.day}</span>
          </div>
        ))}
        <p className="text-[10px] text-muted pt-1">
          The app already factors these automatically — shown here so you know its reasoning.
        </p>
      </div>
    </div>
  );
}
