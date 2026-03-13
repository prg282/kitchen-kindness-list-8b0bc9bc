import { useState, useRef, useEffect } from 'react';
import { Plus, History, X, Mic, MicOff } from 'lucide-react';
import { categorizeItem, getCategoryInfo, CategoryType, KnownItem } from '@/lib/groceryCategories';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface GroceryInputProps {
  onAddItem: (name: string, category: CategoryType, quantity?: string) => void;
  searchKnownItems: (query: string) => KnownItem[];
  getFrequentItems: (limit?: number) => KnownItem[];
  onDeleteKnownItem?: (id: string) => void;
}

export function GroceryInput({ onAddItem, searchKnownItems, getFrequentItems, onDeleteKnownItem }: GroceryInputProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [previewCategory, setPreviewCategory] = useState<CategoryType | null>(null);
  const [suggestions, setSuggestions] = useState<KnownItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { isListening, isSupported, transcript, toggleListening } = useVoiceInput({ onAddItem });

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
      onAddItem(value.trim(), category, quantity.trim() || undefined);
      setValue('');
      setQuantity('');
      setPreviewCategory(null);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: KnownItem) => {
    onAddItem(item.name, item.category, quantity.trim() || undefined);
    setValue('');
    setQuantity('');
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
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center gap-2 md:gap-3 bg-card rounded-lg shadow-medium p-1.5 md:p-2 border border-border/50 transition-all duration-200 focus-within:shadow-elevated focus-within:border-primary/30">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('input.qty')}
              className="w-12 md:w-16 bg-muted/50 px-1.5 md:px-2 py-2 md:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm md:text-base rounded-md text-center"
            />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isListening ? (transcript || 'Listening...') : t('input.placeholder')}
            className="flex-1 bg-transparent px-2 md:px-4 py-2 md:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-base md:text-lg"
          />
          {categoryInfo && (
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-accent/50 text-xs md:text-sm text-accent-foreground animate-fade-in-up">
              <span>{categoryInfo.icon}</span>
              <span className="font-medium">{categoryInfo.name}</span>
            </div>
          )}
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-lg transition-all duration-200",
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </form>

      {/* Live transcript indicator */}
      {isListening && transcript && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-foreground animate-fade-in">
          <span className="text-destructive font-medium">🎤 </span>
          {transcript}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1.5 md:mt-2 bg-card border border-border/50 rounded-lg shadow-elevated z-20 overflow-hidden animate-fade-in"
        >
          {!value.trim() && (
            <div className="px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1.5 md:gap-2">
              <History className="w-2.5 h-2.5 md:w-3 md:h-3" />
              {t('input.recentItems')}
            </div>
          )}
          {suggestions.map((item, index) => {
            const itemCategoryInfo = getCategoryInfo(item.category);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 transition-colors duration-150",
                  index === selectedIndex 
                    ? "bg-primary/10" 
                    : "hover:bg-muted/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex-1 flex items-center gap-2 md:gap-3 text-left"
                >
                  <span className="text-base md:text-lg">{itemCategoryInfo.icon}</span>
                  <span className="flex-1 text-sm md:text-base text-foreground">{item.name}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {item.usage_count > 1 ? `${item.usage_count}x` : ''}
                  </span>
                </button>
                {onDeleteKnownItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteKnownItem(item.id);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove from history"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
