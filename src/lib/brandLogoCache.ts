// Persistent cache for Clearbit brand logos.
// Stores fetched logos as data URLs in localStorage so they load instantly on
// subsequent visits and aren't re-fetched from the network every time.

const STORAGE_PREFIX = 'brandLogo:v1:';
const NEGATIVE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // re-try failed logos after a week
const POSITIVE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // refresh cached logos monthly

interface CacheEntry {
  dataUrl: string | null; // null = known-missing
  ts: number;
}

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

function key(domain: string) {
  return STORAGE_PREFIX + domain;
}

function readStorage(domain: string): CacheEntry | null {
  if (memory.has(domain)) return memory.get(domain)!;
  try {
    const raw = localStorage.getItem(key(domain));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    memory.set(domain, entry);
    return entry;
  } catch {
    return null;
  }
}

function writeStorage(domain: string, entry: CacheEntry) {
  memory.set(domain, entry);
  try {
    localStorage.setItem(key(domain), JSON.stringify(entry));
  } catch {
    // Quota exceeded — clear old entries and try again best-effort.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
      }
      localStorage.setItem(key(domain), JSON.stringify(entry));
    } catch {
      /* give up */
    }
  }
}

function fresh(entry: CacheEntry) {
  const ttl = entry.dataUrl ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
  return Date.now() - entry.ts < ttl;
}

/** Synchronous lookup — returns a cached data URL if we have a fresh hit. */
export function getCachedLogo(domain?: string | null): string | null | undefined {
  if (!domain) return undefined;
  const entry = readStorage(domain);
  if (entry && fresh(entry)) return entry.dataUrl; // may be null (known-missing)
  return undefined; // unknown — caller should fetch
}

/** Fetches the logo (de-duplicated) and caches the result as a data URL. */
export function fetchAndCacheLogo(domain: string, url: string): Promise<string | null> {
  const existing = inflight.get(domain);
  if (existing) return existing;

  const p = (async () => {
    try {
      // Use CORS mode so we can read the body. If the server doesn't allow
      // CORS the fetch will reject — that's fine, the <img> tag can still
      // load the URL directly via the browser's HTTP cache. We only poison
      // the cache on a real image load error (onError), not on fetch failure.
      const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
      if (!res.ok) {
        // 404 etc. — definitively missing
        if (res.status === 404) writeStorage(domain, { dataUrl: null, ts: Date.now() });
        return null;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      writeStorage(domain, { dataUrl, ts: Date.now() });
      return dataUrl;
    } catch {
      // Network/CORS failure — don't cache, let <img> try directly.
      return null;
    } finally {
      inflight.delete(domain);
    }
  })();

  inflight.set(domain, p);
  return p;
}

/** Mark a logo URL as broken (called from <img onError>). */
export function markLogoMissing(domain: string) {
  writeStorage(domain, { dataUrl: null, ts: Date.now() });
}
