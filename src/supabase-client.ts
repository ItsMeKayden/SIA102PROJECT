import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://tqgctaipyaoiemuvfhfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ2N0YWlweWFvaWVtdXZmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODU1ODYsImV4cCI6MjA4NzI2MTU4Nn0.jRryv_vrM7xauIA3GlTKn5JoDUJgOAK-6ihQw9xPnM4',
);
