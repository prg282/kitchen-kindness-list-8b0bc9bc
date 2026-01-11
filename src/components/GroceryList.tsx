import { useState, useEffect } from 'react';
import { ShoppingBasket, Sparkles, Trash2 } from 'lucide-react';
import { GroceryInput } from './GroceryInput';
import { CategorySection } from './CategorySection';
import { GroceryItem, CategoryType, categories } from '@/lib/groceryCategories';

const STORAGE_KEY = 'grocery-list-items';

export function GroceryList() {
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (name: string, category: CategoryType) => {
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name,
      category,
      checked: false,
    };
    setItems(prev => [...prev, newItem]);
  };

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearChecked = () => {
    setItems(prev => prev.filter(item => !item.checked));
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<CategoryType, GroceryItem[]>);

  // Sort categories by their order in the categories array
  const sortedCategories = [...categories, { id: 'other' as CategoryType, name: 'Other', icon: '📦', keywords: [] }]
    .filter(cat => groupedItems[cat.id]?.length > 0);

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <ShoppingBasket className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Grocery List</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart auto-categorization
                </p>
              </div>
            </div>
            {checkedItems > 0 && (
              <button
                onClick={clearChecked}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear checked</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          {totalItems > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {checkedItems} of {totalItems} items
                </span>
                <span className="font-medium text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Input */}
          <GroceryInput onAddItem={addItem} />
        </div>
      </header>

      {/* Content */}
      <main className="container py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBasket className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif text-foreground mb-2">Your list is empty</h2>
            <p className="text-muted-foreground max-w-sm">
              Start adding items above. They'll be automatically organized into categories!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category.id}
                items={groupedItems[category.id] || []}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
