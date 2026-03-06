import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
} from '../../types';
import { createNotification } from './notificationService';

//Appointment Service
// Appoint Backend Service

// Get all appointments
export const getAllAppointments = async (): Promise<{
  data: Appointment[] | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get appointments by doctor
export const getAppointmentsByDoctorId = async (
  doctorId: string,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Get appointments by date
export const getAppointmentsByDate = async (
  date: string,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', date)
      .order('appointment_time', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get upcoming appointments
export const getUpcomingAppointments = async (
  limit: number = 10,
): Promise<{ data: Appointment[] | null; error: string | null }> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
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

// Create appointment
export const createAppointment = async (
  appointmentData: AppointmentInsert,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update appointment
export const updateAppointment = async (
  id: string,
  appointmentData: AppointmentUpdate,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Delete appointment
export const deleteAppointment = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Cancel appointment
export const cancelAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Complete appointment
export const completeAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'Completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Approve a pending appointment (admin only) - notifies the assigned doctor
export const approveAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'Approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify the assigned doctor/staff
    if (data?.doctor_id) {
      await createNotification({
        staff_id: data.doctor_id,
        title: 'Appointment Approved',
        message: `Your appointment request for patient "${data.patient_name}" on ${new Date(data.appointment_date).toLocaleDateString()} at ${data.appointment_time} has been approved by admin.`,
        type: 'success',
      });
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Accept an admin-assigned appointment (staff/doctor only) - notifies admin
export const acceptAssignedAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'Approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify admin (staff_id: null = broadcast to admins)
    await createNotification({
      staff_id: null,
      title: 'Appointment Accepted by Doctor',
      message: `The appointment for patient "${data.patient_name}" on ${new Date(data.appointment_date).toLocaleDateString()} at ${data.appointment_time} has been accepted by the assigned doctor.`,
      type: 'success',
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Reject a pending appointment (admin only) - notifies the assigned doctor
export const rejectAppointment = async (
  id: string,
  reason?: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Staff rejects an admin-assigned appointment - notifies admin
export const rejectAssignedAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Start an appointment — sets status to 'Accepted' (in-progress)
// The caller is responsible for also setting the doctor's duty_status to 'On Duty'
export const startAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Mark appointment as No Show
export const noShowAppointment = async (
  id: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Reschedule an appointment — updates date/time, keeps status 'Approved'
export const rescheduleAppointment = async (
  id: string,
  newDate: string,
  newTime: string,
): Promise<{ data: Appointment | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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

// Get appointment statistics
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
      .from('appointments')
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
