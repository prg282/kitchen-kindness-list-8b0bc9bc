import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { GroceryItemComponent } from './GroceryItem';
import { GroceryItem } from '@/lib/groceryCategories';

interface SortableGroceryItemProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newName: string, newQuantity?: string) => void;
}

export function SortableGroceryItem({ item, onToggle, onDelete, onEdit }: SortableGroceryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button
        className="touch-none p-1 rounded text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <GroceryItemComponent
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
