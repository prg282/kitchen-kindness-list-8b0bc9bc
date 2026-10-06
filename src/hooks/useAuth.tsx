import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { readSnapshot, writeSnapshot, isOffline } from '@/lib/offlineCache';

const USER_KEY = 'auth-user';
const PROFILE_KEY = 'auth-profile';

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  household_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Offline or network failure: fall back to last known profile
      const cached = readSnapshot<Profile>(PROFILE_KEY);
      if (cached && cached.id === userId) { setProfile(cached); return; }
      console.error('Error fetching profile:', error);
      setProfile(null);
      return;
    }

    writeSnapshot(PROFILE_KEY, data);
    setProfile(data);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // While offline, a failed token refresh must not log the user out
        if (!session && isOffline() && event !== 'SIGNED_OUT') {
          setLoading(false);
          return;
        }
        if (session?.user) writeSnapshot(USER_KEY, session.user);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch with setTimeout
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    const applyOfflineFallback = () => {
      const u = readSnapshot<User>(USER_KEY);
      if (!u) return false;
      setUser(u);
      setProfile(readSnapshot<Profile>(PROFILE_KEY));
      setLoading(false);
      return true;
    };

    // Don't hang on a cold offline start
    const offlineTimer = setTimeout(() => {
      if (isOffline()) applyOfflineFallback();
    }, 1500);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(offlineTimer);
      if (!session && isOffline() && applyOfflineFallback()) return;
      if (session?.user) writeSnapshot(USER_KEY, session.user);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => { clearTimeout(offlineTimer); subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem('offline-snapshot-v1:' + USER_KEY); localStorage.removeItem('offline-snapshot-v1:' + PROFILE_KEY); } catch { /* noop */ }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {

    if (user?.id) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
