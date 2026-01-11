import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { categorizeItem, getCategoryInfo, CategoryType } from '@/lib/groceryCategories';

interface GroceryInputProps {
  onAddItem: (name: string, category: CategoryType) => void;
}

export function GroceryInput({ onAddItem }: GroceryInputProps) {
  const [value, setValue] = useState('');
  const [previewCategory, setPreviewCategory] = useState<CategoryType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim()) {
      setPreviewCategory(categorizeItem(value));
    } else {
      setPreviewCategory(null);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      const category = categorizeItem(value.trim());
      onAddItem(value.trim(), category);
      setValue('');
      setPreviewCategory(null);
    }
  };

  const categoryInfo = previewCategory ? getCategoryInfo(previewCategory) : null;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center gap-3 bg-card rounded-lg shadow-medium p-2 border border-border/50 transition-all duration-200 focus-within:shadow-elevated focus-within:border-primary/30">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add an item... (e.g., apples, milk, chicken)"
          className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
        />
        {categoryInfo && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 text-sm text-accent-foreground animate-fade-in-up">
            <span>{categoryInfo.icon}</span>
            <span className="font-medium">{categoryInfo.name}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-medium"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </form>
  );
}
