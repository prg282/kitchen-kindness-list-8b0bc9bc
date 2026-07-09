import { Bell, Plus, X } from 'lucide-react';
import { KnownItem, getCategoryInfo } from '@/lib/groceryCategories';

interface RemindersBannerProps {
  reminders: KnownItem[];
  onAdd: (item: KnownItem) => void;
  onDismiss: (id: string) => void;
}

export function RemindersBanner({ reminders, onAdd, onDismiss }: RemindersBannerProps) {
  if (reminders.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 md:p-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Bell className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Probably running low
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Based on how often your household buys these
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {reminders.map((r) => {
          const cat = getCategoryInfo(r.category);
          return (
            <div
              key={r.id}
              className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-card border border-border/60 shadow-soft"
            >
              <button
                onClick={() => onAdd(r)}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm text-foreground hover:text-primary transition-colors"
                title={`Add ${r.name}`}
              >
                <span>{cat.icon}</span>
                <span className="font-medium">{r.name}</span>
                <Plus className="w-3.5 h-3.5 opacity-70" />
              </button>
              <button
                onClick={() => onDismiss(r.id)}
                className="p-0.5 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Not now"
                aria-label="Dismiss reminder"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
