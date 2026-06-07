import { useEffect, useMemo, useState } from 'react';
import { brandLogoCandidates, findBrandByName, type LoyaltyBrand } from '@/lib/loyaltyCards';
import { fetchAndCacheLogo, getCachedLogo, markLogoMissing } from '@/lib/brandLogoCache';

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface BrandLogoProps {
  brand?: LoyaltyBrand;
  name?: string;
  color?: string | null;
  className?: string;
  textClassName?: string;
  rounded?: string;
}

/**
 * Renders a store logo by trying several free logo services in order
 * (Google favicons → DuckDuckGo → Clearbit). Falls back to initials on a
 * coloured tile. Successful logos are cached as data URLs in localStorage.
 */
export function BrandLogo({
  brand,
  name,
  color,
  className = 'w-10 h-10',
  textClassName = 'text-xs',
  rounded = 'rounded-md',
}: BrandLogoProps) {
  const resolved = brand || (name ? findBrandByName(name) : undefined);
  const displayName = brand?.name || name || '';
  const bg = color || resolved?.color || 'hsl(var(--primary))';
  const domain = resolved?.domain;
  const candidates = useMemo(() => brandLogoCandidates(domain), [domain]);

  const cached = getCachedLogo(domain);
  const [src, setSrc] = useState<string | null>(() => {
    if (cached !== undefined) return cached; // hit (data URL or known-missing null)
    return candidates[0] ?? null;
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!domain || candidates.length === 0) return;
    const hit = getCachedLogo(domain);
    if (hit !== undefined) {
      setSrc(hit);
      return;
    }
    let active = true;
    (async () => {
      for (const url of candidates) {
        const dataUrl = await fetchAndCacheLogo(domain, url);
        if (!active) return;
        if (dataUrl) {
          setSrc(dataUrl);
          return;
        }
      }
      // None of the fetches succeeded — leave src as the first candidate so
      // the browser can still try loading it directly (CORS-free <img>).
    })();
    return () => {
      active = false;
    };
  }, [domain, candidates]);

  return (
    <div
      className={`${className} ${rounded} flex items-center justify-center overflow-hidden shrink-0`}
      style={{ background: bg }}
    >
      {src ? (
        <img
          src={src}
          alt={displayName}
          loading="lazy"
          onError={() => {
            // Try the next candidate URL before giving up.
            const next = attempt + 1;
            if (next < candidates.length) {
              setAttempt(next);
              setSrc(candidates[next]);
            } else {
              if (domain) markLogoMissing(domain);
              setSrc(null);
            }
          }}
          className="w-full h-full object-contain bg-white p-1"
        />
      ) : (
        <span className={`text-white font-bold ${textClassName}`}>{initials(displayName)}</span>
      )}
    </div>
  );
}
