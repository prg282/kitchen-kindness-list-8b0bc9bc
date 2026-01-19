import { ShoppingBasket, Sparkles, Trash2, LogOut, Users, Loader2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GroceryInput } from './GroceryInput';
import { CategorySection } from './CategorySection';
import { CategoryType, categories } from '@/lib/groceryCategories';
import { useGroceryList } from '@/hooks/useGroceryList';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function GroceryList() {
  const navigate = useNavigate();
  const { 
    items, 
    loading, 
    addItem, 
    toggleItem, 
    deleteItem, 
    editItem, 
    clearChecked,
    searchKnownItems,
    getFrequentItems,
    deleteKnownItem,
  } = useGroceryList();
  
  const { profile, signOut } = useAuth();

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<CategoryType, typeof items>);

  // Sort categories by their order in the categories array
  const sortedCategories = [...categories, { id: 'other' as CategoryType, name: 'Other', icon: '📦', keywords: [] }]
    .filter(cat => groupedItems[cat.id]?.length > 0);

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm md:text-base text-muted-foreground">Loading your grocery list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container py-4 md:py-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                <ShoppingBasket className="w-5 h-5 md:w-7 md:h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground">Grocery List</h1>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-1.5">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Smart auto-categorisation • Synced with household
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {checkedItems > 0 && (
                <button
                  onClick={clearChecked}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Clear checked</span>
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/household')}
                title="Household settings"
                className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
                className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>

          {/* User info */}
          {profile && (
            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Signed in as {profile.display_name || profile.email}</span>
            </div>
          )}

          {/* Progress bar */}
          {totalItems > 0 && (
            <div className="mb-3 md:mb-4">
              <div className="flex items-center justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                <span className="text-muted-foreground">
                  {checkedItems} of {totalItems} items
                </span>
                <span className="font-medium text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Input */}
          <GroceryInput 
            onAddItem={addItem} 
            searchKnownItems={searchKnownItems}
            getFrequentItems={getFrequentItems}
            onDeleteKnownItem={deleteKnownItem}
          />
        </div>
      </header>

      {/* Content */}
      <main className="container py-4 md:py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mb-4 md:mb-6">
              <ShoppingBasket className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg md:text-xl font-serif text-foreground mb-2">Your list is empty</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-sm">
              Start adding items above. They'll be automatically organised into categories and synced with your household!
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
                onEdit={editItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
