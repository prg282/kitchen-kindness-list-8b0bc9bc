import { useState } from 'react';
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useBudget, formatRand } from '@/hooks/useBudget';
import { getCategoryInfo } from '@/lib/groceryCategories';
import { CategoryType } from '@/lib/groceryCategories';

interface BudgetSheetProps {
  /** Total of unchecked + checked prices on the current list */
  listTotal: number;
  checkedTotal: number;
  pricedCount: number;
  totalCount: number;
}

export function BudgetSheet({ listTotal, checkedTotal, pricedCount, totalCount }: BudgetSheetProps) {
  const [open, setOpen] = useState(false);
  const { months, monthTotal, monthCount, changePct, topCategories, purchases, loading, refresh } =
    useBudget();

  const peak = Math.max(1, ...months.map((m) => m.total));

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) refresh();
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Budget & spend"
          className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
        >
          <Wallet className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Budget</SheetTitle>
          <SheetDescription>
            Add a price to items to track your trolley total and monthly spend.
          </SheetDescription>
        </SheetHeader>

        {/* Current list */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">This list</p>
          <p className="text-3xl font-display mt-1">{formatRand(listTotal)}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>In the trolley: {formatRand(checkedTotal)}</span>
            <span>
              {pricedCount} of {totalCount} items priced
            </span>
          </div>
        </div>

        {/* This month */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">This month</p>
            {changePct !== null && (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  changePct > 0 ? 'text-destructive' : 'text-success'
                }`}
              >
                {changePct > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {Math.abs(Math.round(changePct))}% vs last month
              </span>
            )}
          </div>
          <p className="text-3xl font-display mt-1">{formatRand(monthTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">{monthCount} items bought</p>

          {/* Trend bars */}
          <div className="mt-4 flex items-end gap-2 h-24">
            {months.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary transition-all"
                    style={{ height: `${Math.max(4, (m.total / peak) * 100)}%` }}
                    title={formatRand(m.total)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        {topCategories.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Where it went this month
            </p>
            <div className="space-y-2">
              {topCategories.map(({ category, total }) => {
                const info = getCategoryInfo(category as CategoryType);
                const pct = monthTotal > 0 ? (total / monthTotal) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-base">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{info.name}</span>
                        <span className="font-medium">{formatRand(total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent */}
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent buys</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet — add a price to an item, then tick it off to record the spend.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {purchases.slice(0, 15).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="truncate">
                    {p.quantity && <span className="text-primary mr-1">{p.quantity}</span>}
                    {p.item_name}
                  </span>
                  <span className="flex-shrink-0 tabular-nums text-muted-foreground">
                    {formatRand(p.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
