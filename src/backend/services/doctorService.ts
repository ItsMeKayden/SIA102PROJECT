import { supabase } from '../../supabase-client';

export interface Doctor {
  doctorID: number;
  doctor_name: string;
  department: string;
  workingHours: string;
  availableSlots: number;
}

// Fetch all doctors ordered by doctorID
export const fetchDoctors = async (): Promise<Doctor[]> => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('doctorID', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Doctor[];
};
