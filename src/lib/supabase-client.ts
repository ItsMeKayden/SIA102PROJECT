import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials plz
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ghstchmtdmcssuqpbuwe.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc3RjaG10ZG1jc3N1cXBidXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzQxMzcsImV4cCI6MjA4NzUxMDEzN30.L6KQdh4NJbKszr8SUocc9F14tZWizelFT_fIs-BxAPw';

// Create Supabase client with proper typing
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
});

// Export the typed client
export const supabase = supabaseClient;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    // Supabase usually returns a PostgrestError-like object
    const err = error as PostgrestError | { message?: string; error_description?: string; hint?: string };
    if (err.message) return err.message;
    if ('error_description' in err && err.error_description) return err.error_description;
    if (err.hint) return `${err.message || 'Database error'} - ${err.hint}`;
  }
  return 'An unknown error occurred';
};

// Wrapper to add timeout to Supabase queries
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Request timed out after ${timeoutMs}ms. Supabase may be unresponsive.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
