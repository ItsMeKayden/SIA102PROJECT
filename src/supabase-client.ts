import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vdcouwfoqibftpltmuur.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkY291d2ZvcWliZnRwbHRtdXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTI1NDIsImV4cCI6MjA4ODEyODU0Mn0.N3vUbV2R5TM1ql7MtcIwT0cNCSGXluMIB4XfVif5RwA',
);
