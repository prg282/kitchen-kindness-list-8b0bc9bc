import { supabase } from '@/integrations/supabase/client';

export type ActivityAction =
  | 'added'
  | 'checked'
  | 'unchecked'
  | 'removed'
  | 'edited'
  | 'assigned'
  | 'unassigned'
  | 'list_created'
  | 'list_renamed'
  | 'list_deleted'
  | 'cleared_checked';

export interface ActivityEvent {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: ActivityAction;
  item_name: string | null;
  list_name: string | null;
  target_name: string | null;
  created_at: string;
}

interface LogArgs {
  householdId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  action: ActivityAction;
  itemName?: string | null;
  listName?: string | null;
  targetName?: string | null;
}

/** Fire-and-forget activity logging — never blocks or breaks the calling action. */
export function logActivity({
  householdId,
  actorId,
  actorName,
  action,
  itemName,
  listName,
  targetName,
}: LogArgs) {
  if (!householdId || !actorId) return;
  void supabase
    .from('activity_events')
    .insert({
      household_id: householdId,
      actor_id: actorId,
      actor_name: actorName || null,
      action,
      item_name: itemName || null,
      list_name: listName || null,
      target_name: targetName || null,
    })
    .then(({ error }) => {
      if (error) console.warn('Activity log failed:', error.message);
    });
}

export function describeActivity(e: ActivityEvent): string {
  const who = e.actor_name || 'Someone';
  const item = e.item_name ? `“${e.item_name}”` : 'an item';
  switch (e.action) {
    case 'added':
      return `${who} added ${item}`;
    case 'checked':
      return `${who} checked off ${item}`;
    case 'unchecked':
      return `${who} unchecked ${item}`;
    case 'removed':
      return `${who} removed ${item}`;
    case 'edited':
      return `${who} updated ${item}`;
    case 'assigned':
      return `${who} assigned ${item} to ${e.target_name || 'a member'}`;
    case 'unassigned':
      return `${who} unassigned ${item}`;
    case 'list_created':
      return `${who} created the list “${e.list_name}”`;
    case 'list_renamed':
      return `${who} renamed a list to “${e.list_name}”`;
    case 'list_deleted':
      return `${who} deleted the list “${e.list_name}”`;
    case 'cleared_checked':
      return `${who} cleared checked items${e.list_name ? ` from “${e.list_name}”` : ''}`;
    default:
      return `${who} made a change`;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
