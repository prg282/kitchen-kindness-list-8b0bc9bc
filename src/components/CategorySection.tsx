import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GroceryItem, CategoryType, getCategoryInfo } from '@/lib/groceryCategories';
import { useLanguage } from '@/hooks/useLanguage';
import { SortableGroceryItem } from './SortableGroceryItem';
import { cn } from '@/lib/utils';

type GroceryItemWithCreatedBy = GroceryItem & { created_by?: string };

interface CategorySectionProps {
  category: CategoryType;
  items: GroceryItemWithCreatedBy[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newName: string, newQuantity?: string) => void;
}

export function CategorySection({ category, items, onToggle, onDelete, onEdit }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryInfo = getCategoryInfo(category);
  const { t } = useLanguage();

  const translatedName = t(`category.${category}` as any);
  const uncheckedCount = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

  // Auto-collapse when every item in the category is checked off
  useEffect(() => {
    if (items.length > 0 && uncheckedCount === 0) {
      setIsExpanded(false);
    } else if (uncheckedCount > 0) {
      setIsExpanded(true);
    }
  }, [uncheckedCount, items.length]);

  const droppableId = `category:${category}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId, data: { category } });

  return (
    <div className={cn('rounded-2xl overflow-hidden animate-fade-in-up', `category-${category}`)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 md:p-4 bg-card border border-border/40 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-200"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl">{categoryInfo.icon}</span>
          <h3 className="font-semibold text-base md:text-lg text-foreground tracking-tight">{translatedName}</h3>
          <div className="flex items-center gap-1.5 ml-1">
            {uncheckedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold bg-primary/10 text-primary">
                {uncheckedCount}
              </span>
            )}
            {checkedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-muted text-muted-foreground">
                {checkedCount} {t('category.done')}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={cn(
              'mt-2 space-y-2 pl-1 min-h-[3.25rem] rounded-2xl transition-all duration-200',
              isOver && 'bg-primary/5 ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
            )}
          >
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground/70 italic px-3 py-4 border border-dashed border-border/60 rounded-xl text-center">
                Drop items here
              </p>
            )}
            {items.map((item) => (
              <SortableGroceryItem
                key={item.id}
                item={item}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
