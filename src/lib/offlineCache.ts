/**
 * Lightweight localStorage snapshot cache so the app can render the last known
 * grocery list instantly — including on a cold start with no network.
 */
const PREFIX = 'offline-snapshot-v1:';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface Snapshot<T> {
  at: number;
  data: T;
}

export function readSnapshot<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot<T>;
    if (!parsed || Date.now() - parsed.at > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSnapshot<T>(key: string, data: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data } satisfies Snapshot<T>));
  } catch {
    /* quota exceeded / unavailable — non-fatal */
  }
}

export function clearSnapshots() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}

export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;
