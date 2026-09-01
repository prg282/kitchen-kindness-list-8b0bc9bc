import { useState } from 'react';
import { ChefHat, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoryType, getCategoryInfo } from '@/lib/groceryCategories';
import { haptic } from '@/lib/haptics';

interface ExtractedItem {
  name: string;
  quantity: string | null;
  category: CategoryType;
}

interface RecipeImportDialogProps {
  onAddItem: (name: string, category: CategoryType, quantity?: string, notes?: string) => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function RecipeImportDialog({ onAddItem, open: openProp, onOpenChange, hideTrigger }: RecipeImportDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(o);
    onOpenChange?.(o);
  };
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const reset = () => {
    setRecipe('');
    setItems([]);
    setSelected({});
    setTitle(null);
  };

  const extract = async () => {
    if (recipe.trim().length < 10) {
      toast.error('Paste a recipe first');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recipe-to-list', {
        body: { recipe: recipe.trim() },
      });

      if (error) {
        const message = (data as any)?.error;
        toast.error(message || 'Could not read that recipe. Please try again.');
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }

      const extracted: ExtractedItem[] = (data as any)?.items ?? [];
      if (extracted.length === 0) {
        toast.error('No ingredients found in that recipe.');
        return;
      }
      setItems(extracted);
      setTitle((data as any)?.title ?? null);
      setSelected(Object.fromEntries(extracted.map((_, i) => [i, true])));
      haptic('success');
    } catch (e) {
      console.error(e);
      toast.error('Could not reach the recipe reader. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const addSelected = async () => {
    const chosen = items.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      toast.info('Select at least one ingredient');
      return;
    }
    setAdding(true);
    try {
      for (const item of chosen) {
        await onAddItem(
          item.name,
          item.category,
          item.quantity ?? undefined,
          title ? `For ${title}` : undefined,
        );
      }
      toast.success(`Added ${chosen.length} ingredient${chosen.length === 1 ? '' : 's'}`);
      haptic('success');
      setOpen(false);
      reset();
    } finally {
      setAdding(false);
    }
  };

  const selectedCount = items.filter((_, i) => selected[i]).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {!hideTrigger && (
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Recipe to shopping list"
          className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
        >
          <ChefHat className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </DialogTrigger>
      )}

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Recipe to list
          </DialogTitle>
          <DialogDescription>
            Paste a recipe and we'll pull out the ingredients, sorted into categories.
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <Textarea
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            placeholder={'Paste your recipe here…\n\ne.g. Chicken curry — 500 g chicken mince, 2 onions, 1 tin chopped tomatoes, 2 tbsp curry powder…'}
            rows={10}
            maxLength={12000}
            className="resize-none"
          />
        ) : (
          <div className="space-y-1">
            {title && <p className="text-sm font-medium mb-2">{title}</p>}
            {items.map((item, i) => {
              const info = getCategoryInfo(item.category);
              return (
                <label
                  key={`${item.name}-${i}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/60 cursor-pointer"
                >
                  <Checkbox
                    checked={!!selected[i]}
                    onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [i]: !!v }))}
                  />
                  <span className="text-base">{info.icon}</span>
                  <span className="flex-1 text-sm">
                    {item.quantity && <span className="text-primary font-medium mr-1">{item.quantity}</span>}
                    {item.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{info.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          {items.length === 0 ? (
            <Button onClick={extract} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading recipe…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Extract ingredients
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={reset} disabled={adding}>
                Start over
              </Button>
              <Button onClick={addSelected} disabled={adding || selectedCount === 0}>
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…
                  </>
                ) : (
                  `Add ${selectedCount} to list`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
