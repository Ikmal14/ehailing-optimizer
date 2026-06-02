'use client';
import { useEffect, useState } from 'react';
import { getCurrentPosition, syncLocation } from '@/lib/geo';

interface Props { onSynced?: () => void }

type State = 'idle' | 'locating' | 'synced' | 'denied' | 'default';

const STORAGE_KEY = 'geo_synced_at';
const RESYNC_MS   = 30 * 60 * 1000; // re-sync at most every 30 min

export function LocationSync({ onSynced }: Props) {
  const [state, setState] = useState<State>('idle');

  async function run(force = false) {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (!force && Date.now() - last < RESYNC_MS) {
      setState('synced');
      return;
    }
    setState('locating');
    try {
      const pos = await getCurrentPosition();
      await syncLocation(pos);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setState('synced');
      setTimeout(() => onSynced?.(), 4000);
    } catch (err: any) {
      setState(err?.code === 1 ? 'denied' : 'default');
    }
  }

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  const label: Record<State, string> = {
    idle:    '',
    locating:'📍 Detecting your location…',
    synced:  '📍 Using your live location',
    denied:  '📍 Location off — using default base',
    default: '📍 Couldn’t locate — using default base',
  };

  if (state === 'idle') return null;

  return (
    <button
      onClick={() => run(true)}
      className="w-full flex items-center justify-center gap-2 text-[11px] text-muted
                 hover:text-content transition-colors py-1">
      <span>{label[state]}</span>
      {(state === 'denied' || state === 'default') && (
        <span className="underline text-accent">retry</span>
      )}
    </button>
  );
}
