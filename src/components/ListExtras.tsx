import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { categorizeItem, categories, CategoryType, GroceryItem } from '@/lib/groceryCategories';
import { toast } from 'sonner';

/** Look up a product name from a grocery barcode via Open Food Facts (free, no key). */
export async function lookupBarcode(code: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,quantity`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    if (!p?.product_name) return null;
    const brand = (p.brands || '').split(',')[0]?.trim();
    const name = String(p.product_name).trim();
    const brandWord = (brand || '').split(/\s+/)[0]?.toLowerCase();
    const showBrand = brand && brand.length <= 20 && brandWord && !name.toLowerCase().includes(brandWord);
    return showBrand ? `${brand} ${name}` : name;
  } catch {
    return null;
  }
}

export function ScanToAdd({
  open,
  onOpenChange,
  onAddItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddItem: (name: string, category: CategoryType, quantity?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (code: string) => {
    onOpenChange(false);
    if (busy) return;
    setBusy(true);
    const id = toast.loading('Looking up product…');
    const name = await lookupBarcode(code);
    setBusy(false);
    if (name) {
      onAddItem(name, categorizeItem(name));
      toast.success(`Added ${name}`, { id });
    } else {
      const manual = window.prompt(`Product not found (${code}). Type a name to add it:`);
      toast.dismiss(id);
      if (manual?.trim()) onAddItem(manual.trim(), categorizeItem(manual.trim()));
    }
  };
  return (
    <BarcodeScanner
      open={open}
      onClose={() => onOpenChange(false)}
      onDetected={handle}
      description="Point your camera at the barcode on the product."
    />
  );
}

/** Build a plain-text version of the list grouped by category. */
export function formatListText(listName: string, items: GroceryItem[]): string {
  const open = items.filter((i) => !i.checked);
  const all = [...categories, { id: 'other' as CategoryType, name: 'Other', icon: '📦', keywords: [] }];
  const lines = [`🛒 ${listName}`, ''];
  for (const cat of all) {
    const group = open.filter((i) => i.category === cat.id);
    if (!group.length) continue;
    lines.push(`${cat.icon} ${cat.name}`);
    group.forEach((i) => lines.push(`• ${i.name}${i.quantity ? ` (${i.quantity})` : ''}`));
    lines.push('');
  }
  if (!open.length) lines.push('All done — nothing left to buy!');
  return lines.join('\n').trim();
}

export async function shareListText(listName: string, items: GroceryItem[], via: 'whatsapp' | 'share') {
  const text = formatListText(listName, items);
  if (via === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({ title: listName, text });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
  }
  await navigator.clipboard.writeText(text);
  toast.success('List copied — paste it into any message');
}
