import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarcodeDisplay } from './BarcodeDisplay';
import { X, Sun } from 'lucide-react';

interface FullscreenBarcodeProps {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  format?: string | null;
  cardNumber?: string | null;
  brandColor?: string | null;
}

export function FullscreenBarcode({ open, onClose, title, value, format, cardNumber, brandColor }: FullscreenBarcodeProps) {
  const wakeLockRef = useRef<any>(null);
  const [boosted, setBoosted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBoosted(true);
    // Keep the screen awake while the barcode is shown
    (async () => {
      try {
        // @ts-ignore
        if (navigator.wakeLock?.request) {
          // @ts-ignore
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake lock might not be supported or permission denied
      }
    })();
    return () => {
      setBoosted(false);
      try { wakeLockRef.current?.release?.(); } catch {
        // Ignore release errors
      }
      wakeLockRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-full w-screen h-screen sm:rounded-none p-0 border-0 bg-white"
        style={{ filter: boosted ? 'brightness(1.15) contrast(1.1)' : undefined }}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between p-4" style={{ background: brandColor || '#000' }}>
            <h2 className="text-white text-lg font-semibold truncate">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-white">
            <div className="w-full max-w-2xl bg-white p-6 rounded-xl">
              <BarcodeDisplay value={value} format={format} width={800} height={260} />
              <p className="text-center text-xl font-mono text-black mt-4 tracking-widest">{value}</p>
              {cardNumber && cardNumber !== value && (
                <p className="text-center text-sm text-neutral-600 mt-1">Card #: {cardNumber}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-neutral-600 text-sm">
              <Sun className="w-4 h-4" />
              Hold up to the till scanner
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
