import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { syncBus, syncState } from './SyncStatus';
import { cn } from '@/lib/utils';

type BannerState = 'offline' | 'syncing' | 'synced';

/**
 * Full-width status banner: Offline / Syncing / Up to date.
 * Stays visible while offline or syncing, and briefly confirms when everything is saved.
 */
export function SyncBanner() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [active, setActive] = useState(syncState.active);
  const [queued, setQueued] = useState(syncState.queued);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const onSync = () => {
      setActive(syncState.active);
      setQueued(syncState.queued);
      if (syncState.active === 0) {
        setShowSynced(true);
        if (t) clearTimeout(t);
        t = setTimeout(() => setShowSynced(false), 2500);
      }
    };
    syncBus.addEventListener('sync', onSync);
    return () => {
      syncBus.removeEventListener('sync', onSync);
      if (t) clearTimeout(t);
    };
  }, []);

  const state: BannerState | null = !online
    ? 'offline'
    : active > 0
      ? 'syncing'
      : showSynced
        ? 'synced'
        : null;

  if (!state) return null;

  const config = {
    offline: {
      Icon: WifiOff,
      title: 'Offline',
      detail:
        queued > 0
          ? `${queued} change${queued === 1 ? '' : 's'} saved on this device — they'll reach your household when you reconnect.`
          : "You're working offline. Changes are saved here and will sync automatically.",
      cls: 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] ring-1 ring-[hsl(var(--destructive))]/25',
      spin: false,
    },
    syncing: {
      Icon: RefreshCw,
      title: 'Syncing…',
      detail: 'Sending your latest changes to the rest of the household.',
      cls: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] ring-1 ring-[hsl(var(--warning))]/25',
      spin: true,
    },
    synced: {
      Icon: CheckCircle2,
      title: 'Up to date',
      detail: 'Everyone in your household can see the latest list.',
      cls: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] ring-1 ring-[hsl(var(--success))]/25',
      spin: false,
    },
  }[state];

  const { Icon } = config;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 mb-3 md:mb-4 animate-fade-in-up',
        config.cls,
      )}
    >
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.spin && 'animate-spin')} />
      <div className="min-w-0">
        <p className="text-xs md:text-sm font-semibold leading-tight">{config.title}</p>
        <p className="text-[11px] md:text-xs opacity-80 leading-snug">{config.detail}</p>
      </div>
    </div>
  );
}
