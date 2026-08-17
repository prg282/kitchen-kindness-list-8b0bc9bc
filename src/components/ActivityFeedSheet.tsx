import { History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { describeActivity, timeAgo } from '@/lib/activity';

export function ActivityFeedSheet() {
  const { events, loadingActivity } = useActivityFeed();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Activity"
          className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
        >
          <History className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Activity
          </SheetTitle>
          <SheetDescription>Recent changes made by your household</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-3">
          {loadingActivity ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No activity yet. Add an item to get started.
            </p>
          ) : (
            <ol className="space-y-3 pb-8">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground leading-snug">{describeActivity(e)}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(e.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default ActivityFeedSheet;
