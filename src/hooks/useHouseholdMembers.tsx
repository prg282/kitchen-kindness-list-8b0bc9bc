import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HouseholdMember {
  id: string;
  display_name: string | null;
  email: string | null;
}

export function memberLabel(m?: HouseholdMember | null) {
  if (!m) return '';
  return m.display_name || m.email?.split('@')[0] || 'Member';
}

export function memberInitials(m?: HouseholdMember | null) {
  const label = memberLabel(m);
  if (!label) return '?';
  const parts = label.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : label.slice(0, 2)).toUpperCase();
}

export function useHouseholdMembers() {
  const { profile } = useAuth();
  const householdId = profile?.household_id;
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!householdId) {
      setMembers([]);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('household_id', householdId);

    if (error) {
      console.error('Error loading household members:', error);
      return;
    }
    setMembers(data || []);
  }, [householdId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, refreshMembers: fetchMembers };
}
