export function scoreColor(score: number): string {
  if (score >= 8)  return 'text-success';
  if (score >= 5)  return 'text-warning';
  if (score >= 2)  return 'text-orange-400';
  return 'text-danger';
}

export function scoreBg(score: number): string {
  if (score >= 8)  return 'bg-success/10 border-success/30';
  if (score >= 5)  return 'bg-warning/10 border-warning/30';
  if (score >= 2)  return 'bg-orange-400/10 border-orange-400/30';
  return 'bg-danger/10 border-danger/30';
}

export function congestionLabel(ratio: number): string {
  if (ratio >= 0.80) return 'Free flow';
  if (ratio >= 0.60) return 'Moderate';
  if (ratio >= 0.40) return 'Heavy';
  return 'Gridlocked';
}

export function congestionColor(ratio: number): string {
  if (ratio >= 0.80) return 'text-success';
  if (ratio >= 0.60) return 'text-warning';
  if (ratio >= 0.40) return 'text-orange-400';
  return 'text-danger';
}

export function weatherEmoji(main: string): string {
  const map: Record<string, string> = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️',
    Drizzle: '🌦️', Thunderstorm: '⛈️', Atmosphere: '🌫️',
  };
  return map[main] ?? '🌡️';
}

export function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    transit: '🚉', office: '🏢', mall: '🛍️',
    hospital: '🏥', university: '🎓', residential: '🏘️',
    tourist: '🗺️', park: '🌳',
  };
  return map[cat] ?? '📍';
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-MY', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
