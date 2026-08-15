import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logActivity } from '@/lib/activity';
import { toast } from 'sonner';

export interface GroceryListRecord {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
  sort_order: number;
}

const ACTIVE_KEY = 'active-grocery-list';

export function useGroceryLists() {
  const { user, profile } = useAuth();
  const householdId = profile?.household_id;
  const [lists, setLists] = useState<GroceryListRecord[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);

  const actorName = profile?.display_name || profile?.email || null;

  const fetchLists = useCallback(async () => {
    if (!householdId) {
      setLists([]);
      setLoadingLists(false);
      return;
    }
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('id, name, icon, is_default, sort_order')
      .eq('household_id', householdId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    setLoadingLists(false);
    if (error) {
      console.error('Error loading lists:', error);
      return;
    }

    let next = data || [];

    // Every household should have at least one list.
    if (next.length === 0) {
      const { data: created } = await supabase
        .from('grocery_lists')
        .insert({ household_id: householdId, name: 'Weekly Shopping', icon: 'shopping-cart', is_default: true })
        .select('id, name, icon, is_default, sort_order')
        .single();
      if (created) next = [created];
    }

    setLists(next);
    setActiveListId((prev) => {
      if (prev && next.some((l) => l.id === prev)) return prev;
      const stored = localStorage.getItem(ACTIVE_KEY);
      if (stored && next.some((l) => l.id === stored)) return stored;
      return next[0]?.id ?? null;
    });
  }, [householdId]);

  useEffect(() => {
    setLoadingLists(true);
    fetchLists();
  }, [fetchLists]);

  const selectList = (id: string) => {
    setActiveListId(id);
    try {
      localStorage.setItem(ACTIVE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const createList = async (name: string, icon = 'shopping-cart') => {
    if (!householdId) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;

    const { data, error } = await supabase
      .from('grocery_lists')
      .insert({
        household_id: householdId,
        name: trimmed,
        icon,
        sort_order: lists.length,
        created_by: user?.id ?? null,
      })
      .select('id, name, icon, is_default, sort_order')
      .single();

    if (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
      return null;
    }

    setLists((prev) => [...prev, data]);
    selectList(data.id);
    logActivity({
      householdId,
      actorId: user?.id,
      actorName,
      action: 'list_created',
      listName: data.name,
    });
    return data;
  };

  const renameList = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const previous = lists;
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));

    const { error } = await supabase.from('grocery_lists').update({ name: trimmed }).eq('id', id);
    if (error) {
      console.error('Error renaming list:', error);
      toast.error('Failed to rename list');
      setLists(previous);
      return;
    }
    logActivity({ householdId, actorId: user?.id, actorName, action: 'list_renamed', listName: trimmed });
  };

  const deleteList = async (id: string) => {
    const list = lists.find((l) => l.id === id);
    if (!list || list.is_default) return;
    if (lists.length <= 1) {
      toast.error('You need at least one list');
      return;
    }

    const previous = lists;
    const remaining = lists.filter((l) => l.id !== id);
    setLists(remaining);
    if (activeListId === id) selectList(remaining[0].id);

    const { error } = await supabase.from('grocery_lists').delete().eq('id', id);
    if (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
      setLists(previous);
      return;
    }
    logActivity({ householdId, actorId: user?.id, actorName, action: 'list_deleted', listName: list.name });
  };

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

  return { lists, activeList, activeListId, loadingLists, selectList, createList, renameList, deleteList };
}
