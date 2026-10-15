import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string, format: string) => void;
  description?: string;
}

function friendlyError(err: any): string {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera access was blocked. Allow camera access in your browser settings, then try again.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No camera found on this device.';
  if (name === 'NotReadableError') return 'Your camera is being used by another app. Close it and try again.';
  if (!navigator.mediaDevices?.getUserMedia) return 'This browser does not support the camera. Try Chrome or Safari.';
  return err?.message || 'Unable to access camera';
}

export function BarcodeScanner({ open, onClose, onDetected, description }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let done = false;
    const reader = new BrowserMultiFormatReader();
    setStarting(true);
    setError(null);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        // Wait for the dialog to mount the <video>
        for (let i = 0; i < 20 && !videoRef.current; i++) await new Promise((r) => setTimeout(r, 25));
        if (cancelled || !videoRef.current) return;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          videoRef.current,
          (result: Result | undefined) => {
            if (result && !cancelled && !done) {
              done = true;
              controls.stop();
              onDetectedRef.current(result.getText(), result.getBarcodeFormat().toString());
            }
          },
        );
        controlsRef.current = controls;
        if (cancelled) controls.stop();
      } catch (err: any) {
        console.warn('Scanner error:', err);
        if (!cancelled) setError(friendlyError(err));
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
          <DialogDescription>
            {description ?? 'Point your camera at the barcode on the back of the loyalty card.'}
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {starting && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {error && (
            <div role="alert" className="absolute inset-0 flex items-center justify-center bg-background/95 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
