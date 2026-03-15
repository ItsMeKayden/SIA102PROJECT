import { supabase } from '../../lib/supabase-client';
import type { Staff } from '../../types';

// Fetch all doctors ordered by ID
export const fetchDoctors = async (): Promise<Staff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Staff[];
};

