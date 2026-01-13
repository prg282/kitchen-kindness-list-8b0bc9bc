import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, X, UserPlus, KeyRound, User } from 'lucide-react';
import { toast } from 'sonner';

const JoinHousehold = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode || !pin) {
      toast.error('Please enter the PIN code');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('join-household', {
        body: {
          inviteCode,
          pin,
          displayName: displayName.trim() || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to join household');
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.session) {
        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast.success(`Welcome! You've joined "${data.household?.name || 'the household'}"!`);
        
        // Redirect to home with full reload to ensure session is picked up
        window.location.href = '/';
      } else {
        throw new Error('No session returned');
      }
    } catch (err: any) {
      console.error('Error joining household:', err);
      const errorMessage = err.message || 'Failed to join household';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show anything if user is already logged in (will redirect)
  if (user) {
    return null;
  }

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
          <CardTitle>Join Household</CardTitle>
          <CardDescription>
            Enter the PIN code shared with you to join the household
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name (optional)
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                disabled={joining}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                PIN Code
              </Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter the 6-character PIN"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={joining}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button 
                type="submit"
                className="w-full" 
                disabled={joining || !pin}
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
                type="button"
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
                disabled={joining}
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinHousehold;