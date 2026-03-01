import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, withTimeout } from '../lib/supabase-client';
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
    try {
      console.log('Fetching staff profile for user_id:', userId);

      const { data, error } = (await withTimeout(
        supabase
          .from('staff')
          .select('*')
          .eq('user_id', userId)
          .single() as unknown as Promise<{ data: any; error: any }>,
      )) as { data: any; error: any };

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
      console.error('Unexpected error fetching staff profile:', error);
      return null;
    }
  };

  // Initialize auth state using onAuthStateChange only.
  // It fires INITIAL_SESSION immediately on mount, so getSession() is not needed
  // and avoids a race condition between the two.
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Safety timeout - force loading to false after 3 seconds
    // Staff profile can continue loading in background
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn(
          'Auth state check timed out, forcing loading to false to show login',
        );
        setLoading(false);
      }
    }, 3000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', _event, session?.user?.id);
      setUser(session?.user ?? null);

      // Set loading to false immediately - don't wait for staff profile
      setLoading(false);
      clearTimeout(timeoutId);

      // Load staff profile in the background (non-blocking)
      if (session?.user) {
        try {
          const profile = await fetchStaffProfile(session.user.id);
          if (mounted) {
            setStaffProfile(profile);
            setUserRole((profile?.user_role as 'admin' | 'staff') ?? null);
          }
        } catch (error) {
          console.error('Error fetching staff profile on auth change:', error);
          if (mounted) {
            setStaffProfile(null);
            setUserRole(null);
          }
        }
      } else {
        if (mounted) {
          setStaffProfile(null);
          setUserRole(null);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    try {
      console.log('Attempting sign in for:', email);

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        10000, // 10 second timeout for auth
      );

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
