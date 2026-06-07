import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarcodeDisplay } from './BarcodeDisplay';

interface PrintableCardProps {
  name: string;
  cardNumber?: string | null;
  barcodeValue?: string | null;
  barcodeFormat?: string | null;
  onDone: () => void;
}

/**
 * Renders a print-only layout, triggers window.print(), then calls onDone.
 * The rest of the app is hidden via the `print:hidden` utility added to <body>.
 */
export function PrintableCard({ name, cardNumber, barcodeValue, barcodeFormat, onDone }: PrintableCardProps) {
  useEffect(() => {
    document.body.classList.add('printing-card');
    const cleanup = () => {
      document.body.classList.remove('printing-card');
      onDone();
    };
    const timer = window.setTimeout(() => {
      window.print();
      cleanup();
    }, 150);
    window.addEventListener('afterprint', cleanup, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-card');
    };
  }, [onDone]);

  return createPortal(
    <div className="print-card-root">
      <div className="print-card">
        <h1 className="print-card-name">{name}</h1>
        {barcodeValue && (
          <div className="print-card-barcode">
            <BarcodeDisplay value={barcodeValue} format={barcodeFormat ?? null} width={480} height={140} />
          </div>
        )}
        {(barcodeValue || cardNumber) && (
          <p className="print-card-number">{cardNumber || barcodeValue}</p>
        )}
        <p className="print-card-foot">Present at till to earn rewards</p>
      </div>
    </div>,
    document.body,
  );
}
