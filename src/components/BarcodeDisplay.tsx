import { useEffect, useRef } from 'react';
import {
  BrowserCodeReader,
} from '@zxing/browser';
import {
  BarcodeFormat,
  EncodeHintType,
  MultiFormatWriter,
} from '@zxing/library';

interface BarcodeDisplayProps {
  value: string;
  format?: string | null;
  width?: number;
  height?: number;
}

const FORMAT_MAP: Record<string, BarcodeFormat> = {
  CODE_128: BarcodeFormat.CODE_128,
  CODE_39: BarcodeFormat.CODE_39,
  EAN_13: BarcodeFormat.EAN_13,
  EAN_8: BarcodeFormat.EAN_8,
  UPC_A: BarcodeFormat.UPC_A,
  UPC_E: BarcodeFormat.UPC_E,
  ITF: BarcodeFormat.ITF,
  QR_CODE: BarcodeFormat.QR_CODE,
  DATA_MATRIX: BarcodeFormat.DATA_MATRIX,
  AZTEC: BarcodeFormat.AZTEC,
  PDF_417: BarcodeFormat.PDF_417,
};

function pickFormat(value: string, hint?: string | null): BarcodeFormat {
  if (hint && FORMAT_MAP[hint]) return FORMAT_MAP[hint];
  // Reasonable fallback for arbitrary card numbers
  return BarcodeFormat.CODE_128;
}

export function BarcodeDisplay({ value, format, width = 320, height = 100 }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    try {
      const writer = new MultiFormatWriter();
      const fmt = pickFormat(value, format);
      const hints = new Map<EncodeHintType, unknown>();
      hints.set(EncodeHintType.MARGIN, 2);
      const isMatrix = fmt === BarcodeFormat.QR_CODE || fmt === BarcodeFormat.DATA_MATRIX || fmt === BarcodeFormat.AZTEC;
      const matrix = writer.encode(value, fmt, width, isMatrix ? width : height, hints);

      const canvas = canvasRef.current;
      const w = matrix.getWidth();
      const h = matrix.getHeight();
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#000000';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (matrix.get(x, y)) ctx.fillRect(x, y, 1, 1);
        }
      }
    } catch (err) {
      console.warn('Barcode render failed:', err);
    }
  }, [value, format, width, height]);

  // Reference BrowserCodeReader to keep the import (tree-shake guard)
  void BrowserCodeReader;

  return <canvas ref={canvasRef} className="w-full h-auto rounded bg-white" />;
}
