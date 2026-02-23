import { supabase } from '../../supabase-client';

export interface AppointmentRow {
  id: number;
  patient_name: string;
  contact_info: string;
  service_type: string;
  doctor_name: string;
  date_time: string;
  Status: string;
  BloodPressure: number;
  Pulse: number;
  Temperature: number;
}

export interface NewAppointmentPayload {
  patient_name: string;
  service_type: string;
  contact_info: string;
  doctor_name: string;
  date_time: string;
  Status: string;
  BloodPressure: number;
  Pulse: number;
  Temperature: number;
}

export const fetchAppointments = async (): Promise<AppointmentRow[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data as AppointmentRow[];
};

export const insertAppointment = async (
  payload: NewAppointmentPayload,
): Promise<AppointmentRow> => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([payload])
    .select();

  if (error) throw new Error(error.message);
  return data[0] as AppointmentRow;
};
