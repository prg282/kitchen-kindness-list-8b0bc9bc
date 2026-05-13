import { useEffect, useState } from 'react';
import { brandLogoUrl, findBrandByName, type LoyaltyBrand } from '@/lib/loyaltyCards';
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
 * Renders a store logo from clearbit when a domain is known, falling back
 * to initials on a coloured tile. Logos are cached as data URLs in
 * localStorage so they load instantly on repeat views.
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
  const remoteUrl = brandLogoUrl(domain);

  // Seed from cache synchronously to avoid a network round-trip on mount.
  const cached = getCachedLogo(domain);
  const [src, setSrc] = useState<string | null>(() => {
    if (cached !== undefined) return cached; // hit (data URL or known-missing null)
    return remoteUrl; // unknown — show remote URL while we cache it
  });

  useEffect(() => {
    if (!domain || !remoteUrl) return;
    const hit = getCachedLogo(domain);
    if (hit !== undefined) {
      setSrc(hit);
      return;
    }
    let active = true;
    fetchAndCacheLogo(domain, remoteUrl).then((dataUrl) => {
      if (active) setSrc(dataUrl ?? remoteUrl);
    });
    return () => {
      active = false;
    };
  }, [domain, remoteUrl]);

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
            if (domain) markLogoMissing(domain);
            setSrc(null);
          }}
          className="w-full h-full object-contain bg-white p-1"
        />
      ) : (
        <span className={`text-white font-bold ${textClassName}`}>{initials(displayName)}</span>
      )}
    </div>
  );
}
