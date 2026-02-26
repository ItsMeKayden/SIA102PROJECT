import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

// Supabase configuration
// Replace these with your actual Supabase project credentials plz
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ghstchmtdmcssuqpbuwe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc3RjaG10ZG1jc3N1cXBidXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzQxMzcsImV4cCI6MjA4NzUxMDEzN30.L6KQdh4NJbKszr8SUocc9F14tZWizelFT_fIs-BxAPw';

// Create Supabase client with proper typing
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
    // Handle Supabase API error format
    const err = error as any;
    if (err.message) return err.message;
    if (err.error_description) return err.error_description;
    if (err.hint) return `${err.message || 'Database error'} - ${err.hint}`;
  }
  return 'An unknown error occurred';
};
