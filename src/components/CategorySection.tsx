import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { GroceryItem, CategoryType, getCategoryInfo } from '@/lib/groceryCategories';
import { GroceryItemComponent } from './GroceryItem';
import { cn } from '@/lib/utils';

interface CategorySectionProps {
  category: CategoryType;
  items: GroceryItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CategorySection({ category, items, onToggle, onDelete }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryInfo = getCategoryInfo(category);
  
  const uncheckedCount = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className={cn("rounded-xl overflow-hidden animate-fade-in-up", `category-${category}`)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryInfo.icon}</span>
          <h3 className="font-semibold text-lg text-foreground">{categoryInfo.name}</h3>
          <div className="flex items-center gap-2 ml-2">
            {uncheckedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {uncheckedCount}
              </span>
            )}
            {checkedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {checkedCount} done
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-2 pl-2">
          {items.map((item) => (
            <GroceryItemComponent
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
