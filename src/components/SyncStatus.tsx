import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncState = 'online' | 'offline' | 'syncing' | 'synced';

export const syncBus = new EventTarget();

export const syncState = {
  active: 0,
  queued: 0,
  lastSyncAt: null as number | null,
  lastError: null as string | null,
  lastErrorAt: null as number | null,
};

function emit() {
  syncBus.dispatchEvent(new CustomEvent('sync', { detail: { ...syncState } }));
}

export function pingSync() {
  syncState.active += 1;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    syncState.queued += 1;
  }
  emit();
}

export function pongSync(opts?: { error?: unknown }) {
  syncState.active = Math.max(0, syncState.active - 1);
  if (opts?.error) {
    const msg = opts.error instanceof Error ? opts.error.message : String(opts.error);
    syncState.lastError = msg;
    syncState.lastErrorAt = Date.now();
  } else {
    syncState.lastSyncAt = Date.now();
    if (typeof navigator !== 'undefined' && navigator.onLine && syncState.queued > 0) {
      syncState.queued = Math.max(0, syncState.queued - 1);
    }
  }
  emit();
}

export function resetQueueCount() {
  syncState.queued = 0;
  emit();
}

export function SyncStatus() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [state, setState] = useState<SyncState>('online');
  const [justSynced, setJustSynced] = useState(false);

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
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { active: number };
      if (detail.active > 0) {
        setState('syncing');
      } else {
        setState('synced');
        setJustSynced(true);
        if (t) clearTimeout(t);
        t = setTimeout(() => setJustSynced(false), 1600);
      }
    };
    syncBus.addEventListener('sync', onSync);
    return () => {
      syncBus.removeEventListener('sync', onSync);
      if (t) clearTimeout(t);
    };
  }, []);

  const effective: SyncState = !online ? 'offline' : state === 'syncing' ? 'syncing' : justSynced ? 'synced' : 'online';

  const config = {
    online: { label: 'Online', Icon: Wifi, cls: 'text-muted-foreground bg-muted/60', dot: 'bg-[hsl(var(--success))]', pulse: false },
    offline: { label: 'Offline', Icon: WifiOff, cls: 'text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 ring-1 ring-[hsl(var(--destructive))]/30', dot: 'bg-[hsl(var(--destructive))]', pulse: false },
    syncing: { label: 'Syncing…', Icon: RefreshCw, cls: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 ring-1 ring-[hsl(var(--warning))]/25', dot: 'bg-[hsl(var(--warning))]', pulse: true },
    synced: { label: 'Saved', Icon: Check, cls: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 ring-1 ring-[hsl(var(--success))]/25', dot: 'bg-[hsl(var(--success))]', pulse: false },
  }[effective];

  const { Icon } = config;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-medium transition-all duration-300',
        config.cls,
      )}
      title={config.label}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dot, config.pulse && 'animate-pulse')} />
      <Icon className={cn('w-3 h-3 md:w-3.5 md:h-3.5', effective === 'syncing' && 'animate-spin')} />
      <span>{config.label}</span>
    </div>
  );
}
