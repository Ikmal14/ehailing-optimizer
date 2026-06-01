'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Props { onRefresh: () => void }

export function RefreshButton({ onRefresh }: Props) {
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    await api.triggerHarvest().catch(() => null);
    setTimeout(() => { onRefresh(); setLoading(false); }, 3000);
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg border border-border bg-panel
                 text-muted hover:text-white hover:border-accent/40 transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed">
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Fetching…
        </span>
      ) : '↻ Refresh'}
    </button>
  );
}
