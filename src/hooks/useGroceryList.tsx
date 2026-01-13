import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { GroceryItem, KnownItem, CategoryType, categorizeItem } from '@/lib/groceryCategories';
import { toast } from 'sonner';

export function useGroceryList() {
  const { user, profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [knownItems, setKnownItems] = useState<KnownItem[]>([]);
  const [loading, setLoading] = useState(true);

  const householdId = profile?.household_id;

  // Fetch grocery items
  const fetchItems = useCallback(async () => {
    if (!householdId) return;

    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load grocery items');
      return;
    }

  setItems(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category as CategoryType,
        checked: item.checked,
        created_by: item.created_by || undefined,
        quantity: item.quantity || undefined,
      }))
    );
  }, [householdId]);

  // Fetch known items
  const fetchKnownItems = useCallback(async () => {
    if (!householdId) return;

    const { data, error } = await supabase
      .from('known_items')
      .select('*')
      .eq('household_id', householdId)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error fetching known items:', error);
      return;
    }

    setKnownItems(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category as CategoryType,
        usage_count: item.usage_count,
        last_used: item.last_used,
      }))
    );
  }, [householdId]);

  // Initial fetch + loading state management
  useEffect(() => {
    // While auth is still resolving, keep list in loading state.
    if (authLoading) {
      setLoading(true);
      return;
    }

    // If logged out, list is not loading.
    if (!user) {
      setLoading(false);
      return;
    }

    // Logged in but profile/household not ready (or failed to load) -> don't spin forever.
    if (!householdId) {
      console.warn('No household_id available yet; skipping grocery fetch.');
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchItems(), fetchKnownItems()]).finally(() => {
      setLoading(false);
    });
  }, [authLoading, user, householdId, fetchItems, fetchKnownItems]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel('grocery-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            setItems(prev => {
              // Check if item already exists to prevent duplicates
              if (prev.some(i => i.id === newItem.id)) return prev;
              return [...prev, {
                id: newItem.id,
                name: newItem.name,
                category: newItem.category as CategoryType,
                checked: newItem.checked,
                created_by: newItem.created_by || undefined,
                quantity: newItem.quantity || undefined,
              }];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as any;
            setItems(prev => prev.map(item => 
              item.id === updatedItem.id 
                ? {
                    id: updatedItem.id,
                    name: updatedItem.name,
                    category: updatedItem.category as CategoryType,
                    checked: updatedItem.checked,
                    created_by: updatedItem.created_by || undefined,
                    quantity: updatedItem.quantity || undefined,
                  }
                : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as any;
            setItems(prev => prev.filter(item => item.id !== deletedItem.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  // Add item
  const addItem = async (name: string, category: CategoryType, quantity?: string) => {
    if (!householdId || !user) return;

    // Optimistic update
    const tempId = crypto.randomUUID();
    const newItem: GroceryItem = {
      id: tempId,
      name,
      category,
      checked: false,
      created_by: user.id,
      quantity,
    };
    setItems(prev => [...prev, newItem]);

    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        household_id: householdId,
        name,
        category,
        checked: false,
        created_by: user.id,
        quantity: quantity || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
      // Rollback
      setItems(prev => prev.filter(i => i.id !== tempId));
      return;
    }

    // Replace temp item with real one
    setItems(prev => prev.map(i => i.id === tempId ? {
      id: data.id,
      name: data.name,
      category: data.category as CategoryType,
      checked: data.checked,
      created_by: data.created_by || undefined,
      quantity: data.quantity || undefined,
    } : i));

    // Save to known items
    await saveKnownItem(name, category);
  };

  // Save known item
  const saveKnownItem = async (name: string, category: CategoryType) => {
    if (!householdId) return;

    const normalizedName = name.toLowerCase().trim();
    const existing = knownItems.find(
      item => item.name.toLowerCase() === normalizedName
    );

    if (existing) {
      await supabase
        .from('known_items')
        .update({
          usage_count: existing.usage_count + 1,
          last_used: new Date().toISOString(),
          category,
        })
        .eq('id', existing.id);
      
      setKnownItems(prev => prev.map(item => 
        item.id === existing.id 
          ? { ...item, usage_count: item.usage_count + 1, category }
          : item
      ));
    } else {
      const { data } = await supabase
        .from('known_items')
        .insert({
          household_id: householdId,
          name: name.trim(),
          category,
          usage_count: 1,
          last_used: new Date().toISOString(),
        })
        .select()
        .single();

      if (data) {
        setKnownItems(prev => [...prev, {
          id: data.id,
          name: data.name,
          category: data.category as CategoryType,
          usage_count: data.usage_count,
          last_used: data.last_used,
        }]);
      }
    }
  };

  // Toggle item
  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, checked: !i.checked } : i
    ));

    const { error } = await supabase
      .from('grocery_items')
      .update({ checked: !item.checked })
      .eq('id', id);

    if (error) {
      console.error('Error toggling item:', error);
      // Rollback
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, checked: item.checked } : i
      ));
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Optimistic update
    setItems(prev => prev.filter(i => i.id !== id));

    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      // Rollback
      setItems(prev => [...prev, item]);
    }
  };

  // Edit item
  const editItem = async (id: string, newName: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newCategory = categorizeItem(newName);
    
    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, name: newName, category: newCategory } : i
    ));

    const { error } = await supabase
      .from('grocery_items')
      .update({ name: newName, category: newCategory })
      .eq('id', id);

    if (error) {
      console.error('Error editing item:', error);
      // Rollback
      setItems(prev => prev.map(i => 
        i.id === id ? item : i
      ));
      return;
    }

    // Save to known items
    await saveKnownItem(newName, newCategory);
  };

  // Clear checked items
  const clearChecked = async () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id);
    if (checkedIds.length === 0) return;

    // Optimistic update
    const checkedItems = items.filter(i => i.checked);
    setItems(prev => prev.filter(i => !i.checked));

    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .in('id', checkedIds);

    if (error) {
      console.error('Error clearing checked items:', error);
      // Rollback
      setItems(prev => [...prev, ...checkedItems]);
    }
  };

  // Search known items
  const searchKnownItems = (query: string): KnownItem[] => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return knownItems
      .filter(item => item.name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 8);
  };

  // Get frequent items
  const getFrequentItems = (limit: number = 10): KnownItem[] => {
    return knownItems
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  };

  return {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    editItem,
    clearChecked,
    searchKnownItems,
    getFrequentItems,
  };
}
