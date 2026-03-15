import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
} from '../../types';
import { createNotification } from './notificationService';

export const getAllAppointments = async (): Promise<{
  data: Appointment[] | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const getAppointmentsByDoctorId = async (
  doctorId: string,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const getAppointmentsByDate = async (
  date: string,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .select('*')
      .eq('appointment_date', date)
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const getUpcomingAppointments = async (
  limit: number = 10,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .select('*')
      .gte('appointment_date', today)
      .in('status', ['Approved', 'Accepted'])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// ── Updated to accept specialization, service_id, service_name ──
export const createAppointment = async (
  appointmentData: AppointmentInsert & {
    specialization?: string | null;
    service_id?: string | null;
    service_name?: string | null;
  },
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const updateAppointment = async (
  id: string,
  appointmentData: AppointmentUpdate,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ ...appointmentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const deleteAppointment = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from('Subsystem2.appointments').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

export const cancelAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const completeAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Completed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const approveAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const acceptAssignedAppointment = async (
  id: string,
  doctorId: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({
        status: 'Approved',
        doctor_id: doctorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('doctor_id', null)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        data: null,
        error: 'Appointment was already claimed by another doctor.',
      };
    }

    await createNotification({
      staff_id: null,
      title: 'Appointment Accepted by Doctor',
      message: `The appointment for patient "${data[0].patient_name}" on ${new Date(data[0].appointment_date).toLocaleDateString()} at ${data[0].appointment_time} has been accepted by a doctor.`,
      type: 'success',
    });

    return { data: data[0], error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const rejectAppointment = async (
  id: string,
  reason?: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (data?.doctor_id) {
      await createNotification({
        staff_id: data.doctor_id,
        title: 'Appointment Rejected',
        message: `The appointment for patient "${data.patient_name}" on ${new Date(data.appointment_date).toLocaleDateString()} was rejected${reason ? ': ' + reason : '.'}`,
        type: 'warning',
      });
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const rejectAssignedAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      staff_id: null,
      title: 'Appointment Rejected by Doctor',
      message: `The appointment for patient "${data.patient_name}" on ${new Date(data.appointment_date).toLocaleDateString()} at ${data.appointment_time} was rejected by the assigned doctor.`,
      type: 'warning',
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const startAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'Accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      staff_id: null,
      title: 'Appointment In Progress',
      message: `Appointment for patient "${data.patient_name}" has started. Doctor is now On Duty.`,
      type: 'info',
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const noShowAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({ status: 'No Show', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      staff_id: null,
      title: 'Appointment No Show',
      message: `Patient "${data.patient_name}" did not show up for their appointment on ${new Date(data.appointment_date).toLocaleDateString()}.`,
      type: 'warning',
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const rescheduleAppointment = async (
  id: string,
  newDate: string,
  newTime: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'Approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      staff_id: null,
      title: 'Appointment Rescheduled',
      message: `Appointment for patient "${data.patient_name}" has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTime}.`,
      type: 'info',
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const getAppointmentStats = async (): Promise<{
  data: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  } | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('Subsystem2.appointments')
      .select('status');
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      scheduled:
        data?.filter((a: { status: string }) =>
          ['Assigned', 'Approved', 'Accepted'].includes(a.status),
        ).length || 0,
      completed:
        data?.filter((a: { status: string }) => a.status === 'Completed')
          .length || 0,
      cancelled:
        data?.filter(
          (a: { status: string }) =>
            a.status === 'Cancelled' || a.status === 'Rejected',
        ).length || 0,
      noShow:
        data?.filter((a: { status: string }) => a.status === 'No Show')
          .length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};
