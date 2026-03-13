import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  onEdit: (id: string, newName: string) => void;
  onReorder?: (categoryItems: GroceryItemWithCreatedBy[]) => void;
}

export function CategorySection({ category, items, onToggle, onDelete, onEdit, onReorder }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryInfo = getCategoryInfo(category);
  const { t } = useLanguage();
  
  const translatedName = t(`category.${category}` as any);
  const uncheckedCount = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [moved] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, moved);

    onReorder?.(newItems);
  };

  return (
    <div className={cn("rounded-xl overflow-hidden animate-fade-in-up", `category-${category}`)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 md:p-4 bg-card border border-border/50 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl">{categoryInfo.icon}</span>
          <h3 className="font-semibold text-base md:text-lg text-foreground">{translatedName}</h3>
          <div className="flex items-center gap-1.5 md:gap-2 ml-1 md:ml-2">
            {uncheckedCount > 0 && (
              <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-primary/10 text-primary">
                {uncheckedCount}
              </span>
            )}
            {checkedCount > 0 && (
               <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-muted text-muted-foreground">
                {checkedCount} {t('category.done')}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      
      {isExpanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-2 space-y-2 pl-1">
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
        </DndContext>
      )}
    </div>
  );
}
