import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncState = 'online' | 'offline' | 'syncing' | 'synced';

const syncBus = new EventTarget();
let activeSyncs = 0;

export function pingSync() {
  activeSyncs += 1;
  syncBus.dispatchEvent(new CustomEvent('sync', { detail: { active: activeSyncs } }));
}

export function pongSync() {
  activeSyncs = Math.max(0, activeSyncs - 1);
  syncBus.dispatchEvent(new CustomEvent('sync', { detail: { active: activeSyncs } }));
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
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { active: number };
      if (detail.active > 0) {
        setState('syncing');
      } else {
        setState('synced');
        setJustSynced(true);
        const t = setTimeout(() => setJustSynced(false), 1600);
        return () => clearTimeout(t);
      }
    };
    syncBus.addEventListener('sync', onSync);
    return () => syncBus.removeEventListener('sync', onSync);
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
      <Icon className={cn('w-3 h-3 md:w-3.5 md:h-3.5', effective === 'syncing' && 'animate-spin')} />
      <span>{config.label}</span>
    </div>
  );
}
