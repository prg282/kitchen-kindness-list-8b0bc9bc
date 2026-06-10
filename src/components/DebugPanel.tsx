import { useEffect, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { syncBus, syncState } from './SyncStatus';
import { cn } from '@/lib/utils';

function formatTime(ts: number | null) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 1000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  // Only show when ?debug=1 is set (or in dev)
  const enabled =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('debug') === '1' ||
      import.meta.env.DEV);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => force((n) => n + 1);
    syncBus.addEventListener('sync', tick);
    const interval = setInterval(tick, 1000); // refresh relative timestamps
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener('online', goOn);
    window.addEventListener('offline', goOff);
    return () => {
      syncBus.removeEventListener('sync', tick);
      clearInterval(interval);
      window.removeEventListener('online', goOn);
      window.removeEventListener('offline', goOff);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-foreground text-background shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Toggle debug panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[280px] rounded-2xl bg-card border border-border shadow-elevated p-4 text-xs space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Sync debug</h3>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <Row label="Network">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full font-medium',
                online
                  ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                  : 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]',
              )}
            >
              {online ? 'online' : 'offline'}
            </span>
          </Row>
          <Row label="In flight">{syncState.active}</Row>
          <Row label="Queued writes">
            <span
              className={cn(
                'font-mono',
                syncState.queued > 0 && 'text-[hsl(var(--warning))] font-semibold',
              )}
            >
              {syncState.queued}
            </span>
          </Row>
          <Row label="Last sync">{formatTime(syncState.lastSyncAt)}</Row>
          <Row label="Last error">
            {syncState.lastError ? (
              <span className="text-[hsl(var(--destructive))]">
                {formatTime(syncState.lastErrorAt)}
              </span>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </Row>
          {syncState.lastError && (
            <pre className="text-[10px] bg-muted/50 rounded-md p-2 max-h-24 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
              {syncState.lastError}
            </pre>
          )}
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
            Background Sync replays queued writes when you reconnect.
          </p>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}
