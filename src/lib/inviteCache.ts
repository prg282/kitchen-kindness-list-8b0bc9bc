/**
 * Caches the most recent household invite locally so it can still be shared
 * while the device is offline. Invites are valid for 7 days server-side.
 */
const KEY = 'household-invite-cache-v1';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Keep a safety margin so we never share an invite that expires mid-use.
const SAFE_TTL_MS = TTL_MS - 12 * 60 * 60 * 1000;

export interface CachedInvite {
  householdId: string;
  code: string;
  pin: string;
  createdAt: number;
}

type Store = Record<string, CachedInvite>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function getCachedInvite(householdId: string): CachedInvite | null {
  const entry = readStore()[householdId];
  if (!entry) return null;
  if (Date.now() - entry.createdAt > SAFE_TTL_MS) return null;
  return entry;
}

export function setCachedInvite(householdId: string, code: string, pin: string) {
  const store = readStore();
  store[householdId] = { householdId, code, pin, createdAt: Date.now() };
  writeStore(store);
}

export function clearCachedInvite(householdId: string) {
  const store = readStore();
  delete store[householdId];
  writeStore(store);
}
