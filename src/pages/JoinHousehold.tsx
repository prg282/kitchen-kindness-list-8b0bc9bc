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

  const normalizedPin = pin.replace(/[\s-]/g, '').toLowerCase();

  const getFunctionErrorMessage = async (err: any) => {
    const response = err?.context;
    if (response && typeof response.json === 'function') {
      try {
        const payload = await response.json();
        if (typeof payload?.error === 'string') return payload.error;
      } catch {
        // Fall back to the SDK message below.
      }
    }
    return err?.message || 'Failed to join household';
  };

  // Note: we intentionally do NOT auto-redirect logged-in users away from
  // this page. People often scan the QR while already signed in — they still
  // need to enter the PIN here. Joining will replace their current session
  // with the new guest account that the edge function provisions.


  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode || normalizedPin.length !== 6) {
      toast.error('Please enter the PIN code');
      return;
    }

    setJoining(true);
    setError(null);

    try {

      const response = await supabase.functions.invoke('join-household', {
        body: {
          inviteCode,
          pin: normalizedPin,
          displayName: displayName.trim() || undefined,
        },
      });

      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error));
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.joinedExisting) {
        toast.success(`You've joined "${data.household?.name || 'the household'}"!`);
        window.location.href = '/';
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast.success(`Welcome! You've joined "${data.household?.name || 'the household'}"!`);
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

  // Note: we intentionally render the form even for logged-in users so they
  // can enter the PIN. handleJoin signs them out first before joining.

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
          {user && (
            <p className="text-xs text-muted-foreground mt-2">
              You're currently signed in. Joining will switch you to the invited household.
            </p>
          )}
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
                maxLength={11}
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="text"
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
                disabled={joining || normalizedPin.length !== 6}
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