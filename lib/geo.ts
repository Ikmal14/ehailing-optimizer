import { api } from './api';

export interface GeoResult {
  lat: number;
  lng: number;
}

// Promisified browser geolocation.
export function getCurrentPosition(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

// Rough distance in km between two coords (for "did the driver move?" checks).
export function distanceKm(a: GeoResult, b: GeoResult): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Push the driver's live coords to the backend and re-run the harvest so
// recommendations recompute from where they actually are.
export async function syncLocation(pos: GeoResult): Promise<void> {
  await api.updateDriver({
    base_lat: pos.lat.toFixed(6) as unknown as string,
    base_lng: pos.lng.toFixed(6) as unknown as string,
  });
  await api.triggerHarvest();
}
