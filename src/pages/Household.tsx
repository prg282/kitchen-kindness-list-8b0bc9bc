import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, ArrowLeft, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const householdSchema = z.object({
  name: z.string().trim().min(1, 'Household name is required').max(100, 'Name must be less than 100 characters'),
});

interface Household {
  id: string;
  name: string;
  created_at: string;
}

const Household = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.household_id) {
      fetchCurrentHousehold();
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

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = householdSchema.safeParse({ name: newHouseholdName });
    if (!validation.success) {
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

        {/* Create New Household */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Household
            </CardTitle>
            <CardDescription>
              Start a new household with a fresh grocery list
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showCreateForm ? (
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="householdName">Household Name</Label>
                  <Input
                    id="householdName"
                    type="text"
                    placeholder="e.g., My Family Home"
                    value={newHouseholdName}
                    onChange={(e) => {
                      setNewHouseholdName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    disabled={creating}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Household
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewHouseholdName('');
                      setError('');
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Household
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Creating a new household will switch you to that household and start a fresh grocery list. 
              Your previous household's data will remain accessible to other members.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Household;
