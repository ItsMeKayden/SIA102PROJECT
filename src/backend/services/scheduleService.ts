import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { Schedule, ScheduleInsert, ScheduleUpdate } from '../../types';

// Schedule Service
// Handles all schedule-related database operations :)

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
