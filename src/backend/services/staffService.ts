import { supabase } from '../../supabase-client';

export interface Doctor {
  doctorID: number;
  created_at: string;
  doctor_name: string;
  department: string;
  workingHours: string;
  availableSlots: number;
  contact_number: string;
  email_address: string;
}

export type NewDoctor = Omit<Doctor, 'doctorID' | 'created_at'>;

export async function fetchDoctors(): Promise<{
  data: Doctor[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase.from('doctors').select('*');
  if (error) return { data: null, error: error.message };
  return { data: data as Doctor[], error: null };
}

export async function addDoctor(
  newDoctor: NewDoctor,
): Promise<{ data: Doctor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('doctors')
    .insert([newDoctor])
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as Doctor, error: null };
}
