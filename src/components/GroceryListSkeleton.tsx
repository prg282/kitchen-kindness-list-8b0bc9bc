import { Skeleton } from '@/components/ui/skeleton';

export function GroceryListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((s) => (
        <div key={s} className="rounded-2xl border border-border/40 bg-card p-3 md:p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-5 w-8 rounded-full ml-1" />
          </div>
          <div className="space-y-2 pl-1">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                <Skeleton className="h-5 w-5 md:h-6 md:w-6 rounded-full" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1 max-w-[60%] rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
