import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, ArrowLeft, Plus, Check, Users, UserMinus, Crown, Pencil, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import InviteShare from '@/components/InviteShare';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const householdSchema = z.object({
  name: z.string().trim().min(1, 'Household name is required').max(100, 'Name must be less than 100 characters'),
});

interface Household {
  id: string;
  name: string;
  created_at: string;
  owner_id: string | null;
}

interface Member {
  id: string;
  display_name: string | null;
  email: string | null;
}

const Household = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const currentHousehold = households[0];
  const isOwner = !!currentHousehold && currentHousehold.owner_id === user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.household_id) {
      fetchCurrentHousehold();
      fetchMembers();
    } else if (user) {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchCurrentHousehold = async () => {
    if (!profile?.household_id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();

    if (error) {
      console.error('Error fetching household:', error);
    } else if (data) {
      setHouseholds([data]);
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!profile?.household_id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('household_id', profile.household_id);
    if (error) {
      console.error('Error fetching members:', error);
      return;
    }
    setMembers(data || []);
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    
    console.log('Creating household with name:', newHouseholdName);

    const validation = householdSchema.safeParse({ name: newHouseholdName });
    if (!validation.success) {
      console.log('Validation failed:', validation.error.errors[0].message);
      setError(validation.error.errors[0].message);
      return;
    }

    setCreating(true);

    try {
      // Create new household
      const { data: newHousehold, error: createError } = await supabase
        .from('households')
        .insert({ name: validation.data.name, owner_id: user!.id })
        .select()
        .single();

      if (createError) throw createError;

      // Update user's profile to use new household
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ household_id: newHousehold.id })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      toast.success('Household created successfully!');
      setNewHouseholdName('');
      setShowCreateForm(false);
      
      // Refresh the page to reload profile data
      window.location.reload();
    } catch (err: any) {
      console.error('Error creating household:', err);
      toast.error(err.message || 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchHousehold = async (householdId: string) => {
    if (householdId === profile?.household_id) return;
    
    setSwitching(householdId);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ household_id: householdId })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Switched household successfully!');
      window.location.reload();
    } catch (err: any) {
      console.error('Error switching household:', err);
      toast.error(err.message || 'Failed to switch household');
    } finally {
      setSwitching(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentHousehold || !isOwner) return;
    if (memberId === currentHousehold.owner_id) {
      toast.error("You can't remove the household owner");
      return;
    }
    setRemoving(memberId);
    try {
      const { error: updErr } = await supabase.rpc('remove_household_member', {
        _member_id: memberId,
      });
      if (updErr) throw updErr;

      toast.success('Member removed');
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      console.error('Error removing member:', err);
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleRenameHousehold = async () => {
    if (!currentHousehold || !isOwner) return;
    const validation = householdSchema.safeParse({ name: renameValue });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    if (validation.data.name === currentHousehold.name) {
      setRenaming(false);
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('households')
        .update({ name: validation.data.name })
        .eq('id', currentHousehold.id);
      if (error) throw error;
      setHouseholds((prev) => prev.map((h) => (h.id === currentHousehold.id ? { ...h, name: validation.data.name } : h)));
      toast.success('Household renamed');
      setRenaming(false);
    } catch (err: any) {
      console.error('Error renaming household:', err);
      toast.error(err.message || 'Failed to rename household');
    } finally {
      setSavingName(false);
    }
  };




  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Household</h1>
              <p className="text-sm text-muted-foreground">
                Manage your household settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Current Household */}
        {households.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Current Household
              </CardTitle>
              <CardDescription>
                Your grocery list is synced with this household
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {households.map((household) => (
                  <div
                    key={household.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex-1 min-w-0">
                      {renaming && isOwner ? (
                        <div className="flex items-center gap-2">
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameHousehold();
                              if (e.key === 'Escape') setRenaming(false);
                            }}
                            maxLength={100}
                            className="h-9"
                          />
                          <Button size="sm" onClick={handleRenameHousehold} disabled={savingName}>
                            {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRenaming(false)} disabled={savingName}>
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{household.name}</p>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setRenameValue(household.name);
                                setRenaming(true);
                              }}
                              aria-label="Rename household"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {new Date(household.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!renaming && (
                      <div className="flex items-center gap-2 text-primary shrink-0">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        {profile?.household_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({members.length})
              </CardTitle>
              <CardDescription>
                People who share this household's grocery list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((m) => {
                  const name = m.display_name || m.email?.split('@')[0] || 'Member';
                  const initial = name.charAt(0).toUpperCase();
                  const memberIsOwner = m.id === currentHousehold?.owner_id;
                  const canRemove = isOwner && !memberIsOwner && m.id !== user.id;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate flex items-center gap-2">
                          <span className="truncate">{name}</span>
                          {memberIsOwner && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                              <Crown className="w-3 h-3" /> Owner
                            </span>
                          )}
                          {m.id === user.id && (
                            <span className="text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        {m.email && (
                          <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                        )}
                      </div>
                      {canRemove && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={removing === m.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Remove ${name}`}
                            >
                              {removing === m.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserMinus className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They'll be moved to a new empty household and will lose access to this household's grocery list and loyalty cards.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(m.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Invite Members */}
        {profile?.household_id && households.length > 0 && (
          <InviteShare
            householdId={profile.household_id}
            householdName={households[0].name}
            userId={user.id}
          />
        )}

      </main>
    </div>
  );
};

export default Household;
