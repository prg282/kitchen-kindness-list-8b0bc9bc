import { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { GroceryItem as GroceryItemType, getCategoryInfo, categorizeItem } from '@/lib/groceryCategories';
import { cn } from '@/lib/utils';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newName: string, newQuantity?: string) => void;
}

export function GroceryItemComponent({ item, onToggle, onDelete, onEdit }: GroceryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const categoryInfo = getCategoryInfo(item.category);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim();
    const trimmedQuantity = editQuantity.trim();
    if (trimmedValue && (trimmedValue !== item.name || trimmedQuantity !== (item.quantity || ''))) {
      onEdit(item.id, trimmedValue, trimmedQuantity || undefined);
    } else {
      setEditValue(item.name);
      setEditQuantity(item.quantity || '');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditValue(item.name);
    setEditQuantity(item.quantity || '');
    setIsEditing(false);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.checked) {
      setIsEditing(true);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg transition-all duration-200 animate-slide-in-right",
        item.checked 
          ? "bg-muted/50 opacity-60" 
          : "bg-card hover:shadow-soft"
      )}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full border-2 transition-all duration-200 flex-shrink-0",
          item.checked
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        {item.checked && (
          <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground animate-check-bounce" />
        )}
      </button>
      
      <span className="text-base md:text-lg mr-0.5 md:mr-1 flex-shrink-0">{categoryInfo.icon}</span>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1.5 md:gap-2">
          <input
            ref={quantityRef}
            type="text"
            value={editQuantity}
            onChange={(e) => setEditQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Qty"
            className="w-10 md:w-14 bg-muted/50 border-b-2 border-primary focus:outline-none text-xs md:text-sm py-1 text-center rounded"
          />
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-b-2 border-primary focus:outline-none text-sm md:text-base py-1"
          />
          <button
            onClick={handleSaveEdit}
            className="p-1 md:p-1.5 rounded-md text-primary hover:bg-primary/10 transition-all duration-200"
          >
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      ) : (
        <span
          onClick={handleStartEdit}
          className={cn(
            "flex-1 text-sm md:text-base transition-all duration-200 cursor-text",
            item.checked && "line-through text-muted-foreground cursor-default"
          )}
        >
          {item.quantity && (
            <span className="font-medium text-primary mr-1">{item.quantity}</span>
          )}
          {item.name}
        </span>
      )}
      
      {!isEditing && (
        <div className="flex items-center gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {!item.checked && (
            <button
              onClick={handleStartEdit}
              className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
