import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SA_LOYALTY_BRANDS, type LoyaltyBrand } from '@/lib/loyaltyCards';
import { Search } from 'lucide-react';

interface BrandPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (brand: LoyaltyBrand) => void;
}

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function BrandPicker({ open, onClose, onPick }: BrandPickerProps) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? SA_LOYALTY_BRANDS.filter(
          (b) => b.name.toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q),
        )
      : SA_LOYALTY_BRANDS;
    return filtered.reduce<Record<string, LoyaltyBrand[]>>((acc, b) => {
      const key = b.category || 'Other';
      (acc[key] ||= []).push(b);
      return acc;
    }, {});
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a rewards programme</DialogTitle>
          <DialogDescription>Search South African loyalty cards by name or category.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. Pick n Pay, Clicks, Engen..."
            className="pl-9"
          />
        </div>
        <ScrollArea className="max-h-[60vh] pr-2">
          {Object.entries(grouped).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No matches</p>
          ) : (
            Object.entries(grouped).map(([cat, brands]) => (
              <div key={cat} className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { onPick(b); onClose(); }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary hover:bg-accent transition text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: b.color }}
                      >
                        {initials(b.name)}
                      </div>
                      <span className="text-xs leading-tight line-clamp-2">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
