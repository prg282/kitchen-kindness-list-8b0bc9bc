import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ActivityEvent } from '@/lib/activity';

export function useActivityFeed() {
  const { profile } = useAuth();
  const householdId = profile?.household_id;
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!householdId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('activity_events')
      .select('id, actor_id, actor_name, action, item_name, list_name, target_name, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(50);

    setLoading(false);
    if (error) {
      console.error('Error loading activity:', error);
      return;
    }
    setEvents((data || []) as ActivityEvent[]);
  }, [householdId]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  // Live updates for household members
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase
      .channel(`activity-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const e = payload.new as ActivityEvent;
          setEvents((prev) => (prev.some((x) => x.id === e.id) ? prev : [e, ...prev].slice(0, 50)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  return { events, loadingActivity: loading, refreshActivity: fetchEvents };
}
