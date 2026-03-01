import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { Staff } from '../types';

interface AuthContextType {
  user: User | null;
  staffProfile: Staff | null;
  userRole: 'admin' | 'staff' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch staff profile when user changes
  const fetchStaffProfile = async (userId: string) => {
    try {
      console.log('Fetching staff profile for user_id:', userId);
      // timeout wrapper to prevent hanging
      const profilePromise = supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();
      const timeout = new Promise<null>((_, rej) =>
        setTimeout(() => rej(new Error('staff profile fetch timeout')), 5000)
      );
      const { data, error } = await Promise.race([profilePromise, timeout]) as any;

      if (error) {
        console.error('Error fetching staff profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('Staff profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error fetching staff profile:', error);
      return null;
    }
  };

  // Initialize auth state. We explicitly fetch the current session on mount
  // then subscribe to changes to keep state updated. The explicit getSession call
  // ensures `loading` is cleared even if onAuthStateChange doesn't fire immediately.
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('AuthContext: starting initial session fetch');
      let timer: NodeJS.Timeout | null = null;
      try {
        // guard against hung promise by racing with a timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: any } }>((_, rej) => {
          timer = setTimeout(() => rej(new Error('session fetch timeout')), 5000);
        });
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!mounted) return;

        console.log('AuthContext: session fetched', session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchStaffProfile(session.user.id);
          setStaffProfile(profile);
          setUserRole(profile?.user_role as 'admin' | 'staff' ?? null);
        } else {
          setStaffProfile(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error during initial auth fetch', err);
      } finally {
        if (timer) clearTimeout(timer);
        if (mounted) {
          setLoading(false);
          console.log('AuthContext: initial loading complete');
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const profile = await fetchStaffProfile(session.user.id);
          setStaffProfile(profile);
          setUserRole(profile?.user_role as 'admin' | 'staff' ?? null);
        } catch (error) {
          console.error('Error fetching staff profile on auth change:', error);
          setStaffProfile(null);
          setUserRole(null);
        }
      } else {
        setStaffProfile(null);
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      console.log('Attempting sign in for:', email);
      
      // race sign-in with a short timeout to avoid infinite hangs
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeout = new Promise<{ data: any; error: any }>((_, rej) =>
        setTimeout(() => rej(new Error('signIn timeout')), 5000)
      );
      const { data, error } = await Promise.race([signInPromise, timeout]) as any;

      if (error) {
        console.error('Auth sign in error:', error);
        return { error: error.message };
      }

      console.log('Auth successful, user ID:', data.user?.id);

      if (data.user) {
        const profile = await fetchStaffProfile(data.user.id);
        if (!profile) {
          console.error('No staff profile found, signing out');
          await supabase.auth.signOut();
          return { error: 'No staff profile found for this user. Please contact admin.' };
        }
        console.log('Setting staff profile:', profile);
        setStaffProfile(profile);
        setUserRole(profile.user_role as 'admin' | 'staff');
      }

      console.log('Sign in complete');
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred during sign in' };
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
