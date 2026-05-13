import { useState } from 'react';
import { brandLogoUrl, findBrandByName, type LoyaltyBrand } from '@/lib/loyaltyCards';

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
 * to initials on a coloured tile. Works from a LoyaltyBrand or a saved card name.
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
  const logo = brandLogoUrl(resolved?.domain);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`${className} ${rounded} flex items-center justify-center overflow-hidden shrink-0`}
      style={{ background: bg }}
    >
      {logo && !errored ? (
        <img
          src={logo}
          alt={displayName}
          loading="lazy"
          onError={() => setErrored(true)}
          className="w-full h-full object-contain bg-white p-1"
        />
      ) : (
        <span className={`text-white font-bold ${textClassName}`}>{initials(displayName)}</span>
      )}
    </div>
  );
}
