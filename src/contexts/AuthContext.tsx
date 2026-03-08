import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { Staff } from '../types';

interface AuthContextType {
  user: User | null;
  staffProfile: Staff | null;
  userRole: 'admin' | 'staff' | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch staff profile when user changes
  const fetchStaffProfile = async (userId: string) => {
    let profileTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      console.log('Fetching staff profile for user_id:', userId);
      // timeout wrapper to prevent hanging
      const profilePromise = supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();
      const timeout = new Promise<null>((_, rej) => {
        profileTimer = setTimeout(() => rej(new Error('staff profile fetch timeout')), 5000);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await Promise.race([profilePromise, timeout]) as { data: Staff | null; error: any };

      if (profileTimer) clearTimeout(profileTimer);

      if (error) {
        console.error('Error fetching staff profile:', error);
        console.error('Error details:', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: (error as any).code,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: (error as any).message,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: (error as any).details,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hint: (error as any).hint,
        });
        return null;
      }

      console.log('Staff profile fetched successfully:', data);
      return data;
    } catch (error) {
      if (profileTimer) clearTimeout(profileTimer);
      console.error('Unexpected error fetching staff profile:', error);
      return null;
    }
  };

  // Initialize auth state. We explicitly fetch the current session on mount
  // then subscribe to changes to keep state updated. The explicit getSession call
  // ensures `loading` is cleared even if onAuthStateChange doesn't fire immediately.
  useEffect(() => {
    let mounted = true;
    let lastFetchedUserId: string | null = null;

    const refreshSessionFromStorage = async () => {
      console.log('AuthContext: checking stored session');
      try {
        // Just get the session that's stored - don't try to refresh the token
        // Supabase handles token refresh automatically via autoRefreshToken
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session fetch error:', sessionError);
          setUser(null);
          setStaffProfile(null);
          setUserRole(null);
          return false;
        }

        if (!mounted) return false;

        if (session?.user) {
          console.log('AuthContext: session found in storage', session.user.id);
          setUser(session.user);
          
          // Fetch profile but don't fail the entire auth if profile fetch fails
          try {
            const profile = await fetchStaffProfile(session.user.id);
            if (mounted) {
              setStaffProfile(profile);
              setUserRole(profile?.user_role as 'admin' | 'staff' ?? null);
            }
          } catch (profileErr) {
            console.warn('Profile fetch failed but keeping user logged in:', profileErr);
            // Keep the user logged in even if profile fetch fails
            if (mounted) {
              setStaffProfile(null);
              setUserRole(null);
            }
          }
          return true;
        } else {
          console.log('AuthContext: no valid session found');
          setUser(null);
          setStaffProfile(null);
          setUserRole(null);
          return false;
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setUser(null);
        setStaffProfile(null);
        setUserRole(null);
        return false;
      }
    };

    const init = async () => {
      console.log('AuthContext: starting initial session fetch');
      const result = await refreshSessionFromStorage();
      if (result && lastFetchedUserId === null) {
        // Get the current session to set lastFetchedUserId
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          lastFetchedUserId = session.user.id;
        }
      }
      if (mounted) {
        setLoading(false);
        console.log('AuthContext: initial loading complete');
      }
    };

    init();

    // Listen for visibility changes - when user switches back to this tab, just verify session
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('AuthContext: tab hidden');
      } else {
        console.log('AuthContext: tab visible - quick session check');
        // Just do a quick non-blocking check
        // If session is gone but we think user is logged in, refresh
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && !session?.user) {
            console.log('AuthContext: session lost on tab return');
            refreshSessionFromStorage();
          }
        }).catch(err => {
          console.warn('Session check failed:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also set up periodic session validation every 30 minutes to keep session alive
    const sessionCheckInterval = setInterval(async () => {
      if (!document.hidden && mounted) {
        console.log('AuthContext: periodic session check (30 min)');
        await refreshSessionFromStorage();
      }
    }, 30 * 60 * 1000); // 30 minutes

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', _event, session?.user?.id);
      setUser(session?.user ?? null);
      setLoading(false);

      // Only fetch profile if the user ID changed
      if (session?.user && session.user.id !== lastFetchedUserId) {
        console.log('AuthContext: user ID changed, fetching new profile');
        lastFetchedUserId = session.user.id;
        try {
          const profile = await fetchStaffProfile(session.user.id);
          if (mounted && profile) {
            setStaffProfile(profile);
            setUserRole((profile?.user_role as 'admin' | 'staff') ?? null);
          }
        } catch (error) {
          console.warn('Error fetching staff profile:', error);
        }
      } else if (!session?.user) {
        // User logged out
        lastFetchedUserId = null;
        if (mounted) {
          setStaffProfile(null);
          setUserRole(null);
        }
      }
    });

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    let signInTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      console.log('Attempting sign in for:', email);
      
      // race sign-in with a short timeout to avoid infinite hangs
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timeout = new Promise<{ data: any; error: null }>((_, rej: (reason?: Error) => void) => {
        signInTimer = setTimeout(() => rej(new Error('signIn timeout')), 10000);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await Promise.race([signInPromise, timeout]) as { data: any; error: null };

      if (signInTimer) clearTimeout(signInTimer);

      if (error) {
        console.error('Auth sign in error:', error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (error as any).message };
      }

      console.log('Auth successful, user ID:', data.user?.id);

      if (data.user) {
        const profile = await fetchStaffProfile(data.user.id);
        if (!profile) {
          console.error('No staff profile found, signing out');
          await supabase.auth.signOut();
          return {
            error:
              'No staff profile found for this user. Please contact admin.',
          };
        }
        console.log('Setting staff profile:', profile);
        setStaffProfile(profile);
        setUserRole(profile.user_role as 'admin' | 'staff');
      }

      console.log('Sign in complete');
      return { error: null };
    } catch (error) {
      if (signInTimer) clearTimeout(signInTimer);
      console.error('Unexpected sign in error:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during sign in';
      return { error: errorMsg };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStaffProfile(null);
    setUserRole(null);
  };

  const value: AuthContextType = {
    user,
    staffProfile,
    userRole,
    loading,
    signIn,
    signOut,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
