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
  refreshProfile: () => Promise<void>;
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

  const fetchStaffProfile = async (userId: string) => {
    let profileTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      console.log('Fetching staff profile for user_id:', userId);
      const profilePromise = supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();
      const timeout = new Promise<null>((_, rej) => {
        profileTimer = setTimeout(
          () => rej(new Error('staff profile fetch timeout')),
          5000,
        );
      });
      interface ProfileError {
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
      }
      const { data, error } = (await Promise.race([
        profilePromise,
        timeout,
      ])) as { data: Staff | null; error: ProfileError | null };

      if (profileTimer) clearTimeout(profileTimer);

      if (error) {
        console.error('Error fetching staff profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
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

  // Refreshes the staffProfile from the database without requiring a re-login.
  // Call this after an admin updates a staff member's department/role so the
  // logged-in doctor's profile reflects the latest values immediately.
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await fetchStaffProfile(user.id);
      if (profile) {
        setStaffProfile(profile);
        setUserRole(profile.user_role as 'admin' | 'staff');
      }
    } catch (error) {
      console.warn('refreshProfile failed:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let lastFetchedUserId: string | null = null;

    const refreshSessionFromStorage = async () => {
      console.log('AuthContext: checking stored session');
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

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

          try {
            const profile = await fetchStaffProfile(session.user.id);
            if (mounted) {
              setStaffProfile(profile);
              setUserRole((profile?.user_role as 'admin' | 'staff') ?? null);
            }
          } catch (profileErr) {
            console.warn(
              'Profile fetch failed but keeping user logged in:',
              profileErr,
            );
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('AuthContext: tab hidden');
      } else {
        console.log('AuthContext: tab visible - quick session check');
        supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            if (mounted && !session?.user) {
              console.log('AuthContext: session lost on tab return');
              refreshSessionFromStorage();
            }
          })
          .catch((err) => {
            console.warn('Session check failed:', err);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const sessionCheckInterval = setInterval(
      async () => {
        if (!document.hidden && mounted) {
          console.log('AuthContext: periodic session check (30 min)');
          await refreshSessionFromStorage();
        }
      },
      30 * 60 * 1000,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', _event, session?.user?.id);
      setUser(session?.user ?? null);
      setLoading(false);

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

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeout = new Promise<{ data: { user: User }; error: null }>(
        (_, rej: (reason?: Error) => void) => {
          signInTimer = setTimeout(
            () => rej(new Error('signIn timeout')),
            10000,
          );
        },
      );
      const { data, error } = (await Promise.race([
        signInPromise,
        timeout,
      ])) as { data: { user: User }; error: null };

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
    refreshProfile,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
