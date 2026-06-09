import { ShoppingBasket, Sparkles, Trash2, LogOut, Users, Home, CreditCard } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroceryInput } from './GroceryInput';
import { CategorySection } from './CategorySection';
import { GroceryItemComponent } from './GroceryItem';
import { GroceryListSkeleton } from './GroceryListSkeleton';
import { SyncStatus } from './SyncStatus';
import { CategoryType, categories, GroceryItem } from '@/lib/groceryCategories';
import { useGroceryList } from '@/hooks/useGroceryList';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

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
    reorderItems,
    moveItemToCategory,
  } = useGroceryList();

  const { profile, signOut } = useAuth();
  const { t } = useLanguage();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overCategory, setOverCategory] = useState<CategoryType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Apply live-drag preview: if dragging cross-category, show the item in its hover destination.
  const displayItems = useMemo<GroceryItem[]>(() => {
    if (!activeId || !overCategory) return items;
    return items.map((i) => (i.id === activeId ? { ...i, category: overCategory } : i));
  }, [items, activeId, overCategory]);

  // Group items by category
  const groupedItems = displayItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<CategoryType, GroceryItem[]>);

  const sortedCategories = [
    ...categories,
    { id: 'other' as CategoryType, name: 'Other', icon: '📦', keywords: [] },
  ].filter((cat) => groupedItems[cat.id]?.length > 0);

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const collisionDetection = (args: any) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    const item = items.find((i) => i.id === String(event.active.id));
    if (item) setOverCategory(item.category);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) return;
    const activeItem = items.find((i) => i.id === String(active.id));
    if (!activeItem) return;

    const overData: any = over.data?.current;
    let destCategory: CategoryType | null = null;
    if (overData?.category) {
      destCategory = overData.category as CategoryType;
    } else {
      const overItem = items.find((i) => i.id === String(over.id));
      if (overItem) destCategory = overItem.category;
    }
    if (destCategory && destCategory !== overCategory) {
      setOverCategory(destCategory);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentActiveId = String(active.id);
    const currentOverCategory = overCategory;

    setActiveId(null);
    setOverCategory(null);

    if (!over) return;
    const overId = String(over.id);
    const activeItem = items.find((i) => i.id === currentActiveId);
    if (!activeItem) return;

    // Resolve destination
    let destCategory: CategoryType = activeItem.category;
    const overData: any = over.data?.current;
    if (overData?.category) destCategory = overData.category as CategoryType;
    else {
      const overItem = items.find((i) => i.id === overId);
      if (overItem) destCategory = overItem.category;
    }
    if (currentOverCategory) destCategory = currentOverCategory;

    if (destCategory !== activeItem.category) {
      const destItemsList = items.filter((i) => i.category === destCategory && i.id !== currentActiveId);
      const overItem = items.find((i) => i.id === overId);
      const targetIndex = overItem
        ? destItemsList.findIndex((i) => i.id === overItem.id)
        : destItemsList.length;
      moveItemToCategory(currentActiveId, destCategory, targetIndex >= 0 ? targetIndex : destItemsList.length);
    } else {
      if (currentActiveId === overId) return;
      const list = items.filter((i) => i.category === activeItem.category);
      const oldIndex = list.findIndex((i) => i.id === currentActiveId);
      const newIndex = list.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = [...list];
      const [m] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, m);
      reorderItems(next);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/75 backdrop-blur-xl border-b border-border/40">
          <div className="container py-4 md:py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                <ShoppingBasket className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-display tracking-tight">{t('app.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('loading.groceryList')}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container py-4 md:py-6">
          <GroceryListSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/75 backdrop-blur-xl border-b border-border/40">
        <div className="container py-4 md:py-5">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="p-2 md:p-2.5 rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                <ShoppingBasket className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-display text-foreground tracking-tight">
                  {t('app.title')}
                </h1>
                <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1">
              {checkedItems > 0 && (
                <button
                  onClick={clearChecked}
                  className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{t('app.clearChecked')}</span>
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/cards')}
                title="Rewards Cards"
                className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
              >
                <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/household')}
                title={t('app.householdSettings')}
                className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title={t('app.signOut')}
                className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 rounded-xl"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            {profile ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t('app.signedInAs')} {profile.display_name || profile.email}</span>
              </div>
            ) : <span />}
            <SyncStatus />
          </div>

          {totalItems > 0 && (
            <div className="mb-3 md:mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">
                  {t('app.itemsProgress', { checked: String(checkedItems), total: String(totalItems) })}
                </span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

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
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted to-accent flex items-center justify-center mb-5 shadow-soft">
              <ShoppingBasket className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="text-lg md:text-xl font-display text-foreground mb-2">{t('empty.title')}</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-sm">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveId(null);
              setOverCategory(null);
            }}
          >
            <div className="space-y-3 md:space-y-4">
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

            <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
              {activeItem ? (
                <div className="rounded-xl shadow-elevated bg-card ring-1 ring-border/60 rotate-1 scale-[1.02]">
                  <GroceryItemComponent
                    item={activeItem}
                    onToggle={() => {}}
                    onDelete={() => {}}
                    onEdit={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
