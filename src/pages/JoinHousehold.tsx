import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, Check, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  invite_code: string;
  expires_at: string;
  used_by: string | null;
  household: {
    id: string;
    name: string;
  };
}

const JoinHousehold = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/join/${inviteCode}`);
    }
  }, [user, authLoading, navigate, inviteCode]);

  useEffect(() => {
    if (user && inviteCode) {
      fetchInvitation();
    }
  }, [user, inviteCode]);

  const fetchInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('household_invitations')
        .select(`
          id,
          invite_code,
          expires_at,
          used_by,
          household:households (
            id,
            name
          )
        `)
        .eq('invite_code', inviteCode)
        .single();

      if (error) throw error;

      // Check if invitation is valid
      if (data.used_by) {
        setError('This invitation has already been used.');
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('This invitation has expired.');
        return;
      }

      // Transform the data to match our interface
      const household = Array.isArray(data.household) ? data.household[0] : data.household;
      
      setInvitation({
        ...data,
        household: household as { id: string; name: string },
      });
    } catch (err: any) {
      console.error('Error fetching invitation:', err);
      setError('Invalid or expired invitation link.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!invitation || !user) return;

    setJoining(true);

    try {
      // Update user's profile to join the household
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ household_id: invitation.household.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mark invitation as used
      const { error: inviteError } = await supabase
        .from('household_invitations')
        .update({
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast.success(`You've joined "${invitation.household.name}"!`);
      
      // Redirect to home and reload to get new profile data
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error joining household:', err);
      toast.error(err.message || 'Failed to join household');
    } finally {
      setJoining(false);
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

  const isAlreadyMember = profile?.household_id === invitation?.household.id;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
            {error ? (
              <X className="w-8 h-8 text-destructive" />
            ) : (
              <UserPlus className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle>
            {error ? 'Invalid Invitation' : 'Join Household'}
          </CardTitle>
          <CardDescription>
            {error 
              ? error 
              : isAlreadyMember
                ? "You're already a member of this household"
                : `You've been invited to join a household`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Button 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          ) : invitation && (
            <>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <Home className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-medium text-lg">{invitation.household.name}</p>
              </div>

              {isAlreadyMember ? (
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Go to Grocery List
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Household
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {!isAlreadyMember && profile?.household_id && (
                <p className="text-xs text-muted-foreground text-center">
                  Note: Joining this household will switch you from your current household.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinHousehold;
