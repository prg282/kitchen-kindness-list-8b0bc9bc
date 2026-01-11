import { Check, X } from 'lucide-react';
import { GroceryItem as GroceryItemType, getCategoryInfo } from '@/lib/groceryCategories';
import { cn } from '@/lib/utils';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GroceryItemComponent({ item, onToggle, onDelete }: GroceryItemProps) {
  const categoryInfo = getCategoryInfo(item.category);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 animate-slide-in-right",
        item.checked 
          ? "bg-muted/50 opacity-60" 
          : "bg-card hover:shadow-soft"
      )}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-200",
          item.checked
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        {item.checked && (
          <Check className="w-4 h-4 text-primary-foreground animate-check-bounce" />
        )}
      </button>
      
      <span className="text-lg mr-1">{categoryInfo.icon}</span>
      
      <span
        className={cn(
          "flex-1 text-base transition-all duration-200",
          item.checked && "line-through text-muted-foreground"
        )}
      >
        {item.name}
      </span>
      
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
