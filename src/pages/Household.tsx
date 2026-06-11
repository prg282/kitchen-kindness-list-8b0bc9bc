import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, ArrowLeft, Plus, Check, Users, UserMinus, Crown } from 'lucide-react';
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
        .insert({ name: validation.data.name })
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
                    className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div>
                      <p className="font-medium text-foreground">{household.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(household.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
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
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {name}
                          {m.id === user.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        {m.email && (
                          <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                        )}
                      </div>
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
