/**
 * Empty-state illustrations drawn with semantic design tokens so they theme
 * correctly in both light and dark mode.
 */
export function EmptyBasketIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      role="img"
      aria-label="An empty shopping basket"
      className={className}
    >
      <defs>
        <linearGradient id="basket-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--secondary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>

      {/* soft ground */}
      <ellipse cx="110" cy="152" rx="72" ry="10" fill="hsl(var(--muted))" />

      {/* floating produce hints */}
      <circle cx="52" cy="42" r="9" fill="hsl(var(--produce))" opacity="0.35" />
      <circle cx="176" cy="58" r="7" fill="hsl(var(--bakery))" opacity="0.35" />
      <circle cx="150" cy="26" r="5" fill="hsl(var(--dairy))" opacity="0.35" />

      {/* handle */}
      <path
        d="M84 66V54a26 26 0 0 1 52 0v12"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* basket */}
      <path
        d="M56 70h108l-11 66a12 12 0 0 1-12 10H79a12 12 0 0 1-12-10L56 70Z"
        fill="url(#basket-body)"
        opacity="0.9"
      />
      <rect x="48" y="60" width="124" height="16" rx="8" fill="hsl(var(--primary))" />

      {/* weave */}
      <g stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" opacity="0.35">
        <path d="M78 84l6 58" />
        <path d="M100 84l3 58" />
        <path d="M122 84l-3 58" />
        <path d="M144 84l-6 58" />
        <path d="M64 100h94" />
        <path d="M68 120h86" />
      </g>
    </svg>
  );
}

export function EmptyWalletIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      role="img"
      aria-label="A stack of empty loyalty cards"
      className={className}
    >
      <defs>
        <linearGradient id="wallet-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="156" rx="72" ry="9" fill="hsl(var(--muted))" />

      <rect x="36" y="66" width="148" height="82" rx="16" fill="hsl(var(--muted))" transform="rotate(-8 110 107)" />
      <rect x="42" y="58" width="148" height="82" rx="16" fill="hsl(var(--accent))" transform="rotate(-3 110 99)" />
      <rect x="40" y="44" width="148" height="84" rx="16" fill="url(#wallet-card)" />

      {/* chip */}
      <rect x="58" y="64" width="26" height="19" rx="5" fill="hsl(var(--primary-foreground))" opacity="0.85" />

      {/* barcode */}
      <g fill="hsl(var(--primary-foreground))" opacity="0.75">
        <rect x="58" y="96" width="4" height="20" rx="1" />
        <rect x="66" y="96" width="2" height="20" rx="1" />
        <rect x="72" y="96" width="5" height="20" rx="1" />
        <rect x="81" y="96" width="2" height="20" rx="1" />
        <rect x="87" y="96" width="4" height="20" rx="1" />
        <rect x="95" y="96" width="3" height="20" rx="1" />
        <rect x="102" y="96" width="5" height="20" rx="1" />
        <rect x="111" y="96" width="2" height="20" rx="1" />
      </g>

      {/* sparkle */}
      <path
        d="M158 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"
        fill="hsl(var(--primary-foreground))"
        opacity="0.7"
      />
    </svg>
  );
}
