import { useState, useRef, useEffect } from 'react';
import { Plus, History } from 'lucide-react';
import { categorizeItem, getCategoryInfo, CategoryType, KnownItem } from '@/lib/groceryCategories';
import { cn } from '@/lib/utils';

interface GroceryInputProps {
  onAddItem: (name: string, category: CategoryType) => void;
  searchKnownItems: (query: string) => KnownItem[];
  getFrequentItems: (limit?: number) => KnownItem[];
}

export function GroceryInput({ onAddItem, searchKnownItems, getFrequentItems }: GroceryInputProps) {
  const [value, setValue] = useState('');
  const [previewCategory, setPreviewCategory] = useState<CategoryType | null>(null);
  const [suggestions, setSuggestions] = useState<KnownItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      setPreviewCategory(categorizeItem(value));
      const matches = searchKnownItems(value);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(-1);
    } else {
      setPreviewCategory(null);
      const frequent = getFrequentItems(6);
      setSuggestions(frequent);
    }
  }, [value, searchKnownItems, getFrequentItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      const category = categorizeItem(value.trim());
      onAddItem(value.trim(), category);
      setValue('');
      setPreviewCategory(null);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: KnownItem) => {
    onAddItem(item.name, item.category);
    setValue('');
    setPreviewCategory(null);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (!value.trim()) {
      const frequent = getFrequentItems(6);
      setSuggestions(frequent);
      setShowSuggestions(frequent.length > 0);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 150);
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
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Add an item... (e.g., apples, milk, cumin)"
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

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-elevated z-20 overflow-hidden animate-fade-in"
        >
          {!value.trim() && (
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-2">
              <History className="w-3 h-3" />
              Recent items
            </div>
          )}
          {suggestions.map((item, index) => {
            const itemCategoryInfo = getCategoryInfo(item.category);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
                  index === selectedIndex 
                    ? "bg-primary/10" 
                    : "hover:bg-muted/50"
                )}
              >
                <span className="text-lg">{itemCategoryInfo.icon}</span>
                <span className="flex-1 text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.usage_count > 1 ? `${item.usage_count}x` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
}
