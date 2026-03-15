import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import { createNotification } from './notificationService';
import type { Schedule, ScheduleInsert, ScheduleUpdate } from '../../types';

// Schedule Service
// Handles all schedule-related database operations :)

const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const notifyDoctorNewSchedule = async (
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) => {
  try {
    const { data: staff, error } = await supabase
      .from('staff')
      .select('name, role')
      .eq('id', staffId)
      .single();

    if (error || !staff) return;
    const role = staff.role ?? '';
    if (!/doctor|physician/i.test(role)) return;

    await createNotification({
      staff_id: staffId,
      title: 'New schedule assigned',
      message: `A new schedule has been added for ${weekDaysFull[dayOfWeek]} ${startTime}–${endTime}.`,
      type: 'info',
    });
  } catch {
    // Non-critical; ignore notification failures
  }
};

// Get all schedules
export const getAllSchedules = async (): Promise<{ data: Schedule[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get schedules by staff ID
export const getSchedulesByStaffId = async (staffId: string): Promise<{ data: Schedule[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get schedules by day of week
export const getSchedulesByDay = async (dayOfWeek: number): Promise<{ data: Schedule[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Create schedule
export const createSchedule = async (scheduleData: ScheduleInsert): Promise<{ data: Schedule | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      // Notify the staff (doctors) that a new schedule was added to their account
      void notifyDoctorNewSchedule(data.staff_id, data.day_of_week, data.start_time, data.end_time);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update schedule
export const updateSchedule = async (id: string, scheduleData: ScheduleUpdate): Promise<{ data: Schedule | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .update({ ...scheduleData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Delete schedule (soft delete)
export const deleteSchedule = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Check for schedule conflicts
export const checkScheduleConflicts = async (
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<{ data: boolean; error: string | null }> => {
  try {
    let query = supabase
      .from('schedules')
      .select('*')
      .eq('staff_id', staffId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

    if (excludeScheduleId) {
      query = query.neq('id', excludeScheduleId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasConflict = (data?.length || 0) > 0;

    return { data: hasConflict, error: null };
  } catch (error) {
    return { data: false, error: handleSupabaseError(error) };
  }
};

// Get weekly schedule with staff info
export const getWeeklyScheduleWithStaff = async (): Promise<{ 
  data: (Schedule & { staff: { name: string; role: string } })[] | null; 
  error: string | null 
}> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        staff:staff_id (
          name,
          role
        )
      `)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Soft-delete all active schedules for the given staff IDs (used before re-balancing)
// This includes weekends since the auto-scheduler now covers all 7 days (Sun–Sat).
export const clearWeeklySchedules = async (staffIds: string[]): Promise<{ error: string | null }> => {
  try {
    if (staffIds.length === 0) return { error: null };
    const { error } = await supabase
      .from('schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('staff_id', staffIds)
      .in('day_of_week', [0, 1, 2, 3, 4, 5, 6])
      .eq('is_active', true);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Bulk-insert schedule rows in one round-trip
export const createScheduleBulk = async (scheduleDataArray: ScheduleInsert[]): Promise<{ error: string | null }> => {
  try {
    if (scheduleDataArray.length === 0) return { error: null };

    // Insert rows and return inserted records to allow follow-up notifications
    const { data, error } = await supabase.from('schedules').insert(scheduleDataArray).select();
    if (error) throw error;

    // Notify doctors about their new schedules
    const inserted = data as Schedule[];
    const doctorIds = Array.from(
      new Set(
        inserted.map((s) => s.staff_id).filter(Boolean) as string[],
      ),
    );
    if (doctorIds.length > 0) {
      const { data: staffRows } = await supabase
        .from('staff')
        .select('id, role')
        .in('id', doctorIds);

      const doctorIdSet = new Set(
        (staffRows || [])
          .filter((s) => /doctor|physician/i.test(s.role || ''))
          .map((s) => s.id),
      );

      for (const schedule of inserted) {
        if (doctorIdSet.has(schedule.staff_id)) {
          void notifyDoctorNewSchedule(
            schedule.staff_id,
            schedule.day_of_week,
            schedule.start_time,
            schedule.end_time,
          );
        }
      }
    }

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

