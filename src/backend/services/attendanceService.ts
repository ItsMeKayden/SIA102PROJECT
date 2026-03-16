import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { Attendance, AttendanceInsert, AttendanceUpdate } from '../../types';

// Attendance Backend Service
// Handles all attendance-related database operations :)

// Helper function to get day of week (0 = Sunday, 1 = Monday, etc.)
const getDayOfWeek = (dateStr: string): number => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
};

// Helper function to get staff schedule for a given date
const getStaffScheduleForDate = async (
  staffId: string,
  dateStr: string
): Promise<{ start_time: string; end_time: string } | null> => {
  try {
    const dayOfWeek = getDayOfWeek(dateStr);
    
    const { data, error } = await supabase
      .from('schedules')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    return null;
  }
};

// Helper function to check if staff is late based on clock in time
const isStaffLate = (clockInTime: string, scheduledStartTime: string): boolean => {
  try {
    const clockIn = new Date(`2000-01-01T${clockInTime}`);
    const scheduled = new Date(`2000-01-01T${scheduledStartTime}`);
    
    // If clock in time is more than 1 minute after scheduled start time, it's late
    const diffMinutes = (clockIn.getTime() - scheduled.getTime()) / (1000 * 60);
    return diffMinutes > 1;
  } catch (error) {
    console.error('Error checking if late:', error);
    return false;
  }
};

// Get all attendance records with staff information
export const getAllAttendance = async (): Promise<{ data: (Attendance & { staff_name?: string })[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, staff:staff_id(id, name)')
      .order('date', { ascending: false });

    if (error) throw error;

    // Transform data to flatten staff name
    const transformedData = (data || []).map((record: any) => ({
      ...record,
      staff_name: record.staff?.name || 'Unknown',
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get attendance by staff ID
export const getAttendanceByStaffId = async (staffId: string): Promise<{ data: Attendance[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staffId)
      .order('date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get attendance by date range
export const getAttendanceByDateRange = async (
  staffId: string,
  startDate: string,
  endDate: string
): Promise<{ data: Attendance[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Create attendance record
export const createAttendance = async (attendanceData: AttendanceInsert): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update attendance record
export const updateAttendance = async (id: string, attendanceData: AttendanceUpdate): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update(attendanceData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Delete attendance record
export const deleteAttendance = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Clock in
export const clockIn = async (staffId: string, shift?: string): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Check if staff has a schedule for today
    const schedule = await getStaffScheduleForDate(staffId, dateStr);

    // Block clock in if no schedule exists
    if (!schedule) {
      return {
        data: null,
        error: 'You are not scheduled for today. Please contact your administrator.',
      };
    }

    // Determine status: Late or Present
    let status = 'Present';
    let notes = shift ? `Shift: ${shift}` : null;

    if (isStaffLate(timeStr, schedule.start_time)) {
      status = 'Late';
      notes = shift ? `Shift: ${shift} (Late)` : 'Late';
    }

    const attendanceData: AttendanceInsert = {
      staff_id: staffId,
      date: dateStr,
      time_in: timeStr,
      status,
      notes,
    };

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Clock out
export const clockOut = async (staffId: string): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    // Find the most recent attendance record for this staff_id on today's date where time_out is NULL
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('id')
      .eq('staff_id', staffId)
      .eq('date', dateStr)
      .is('time_out', null)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error
      throw fetchError;
    }

    if (!existingRecord) {
      // No open attendance record found - cannot clock out
      return { 
        data: null, 
        error: 'No clock in record found for today. Please clock in first.' 
      };
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        time_out: timeStr,
      })
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Check if staff is already clocked in today
export const isStaffClockedIn = async (staffId: string): Promise<{ isClockedIn: boolean; error: string | null }> => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('id')
      .eq('staff_id', staffId)
      .eq('date', dateStr)
      .is('time_out', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error
      throw error;
    }

    return { isClockedIn: !!data, error: null };
  } catch (error) {
    return { isClockedIn: false, error: handleSupabaseError(error) };
  }
};

// Get attendance statistics
export const getAttendanceStats = async (staffId: string, startDate: string, endDate: string): Promise<{
  data: {
    present: number;
    late: number;
    overtime: number;
    absent: number;
    totalHours: number;
  } | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const stats = {
      present: data?.filter((a: Attendance) => a.status === 'Present').length || 0,
      late: data?.filter((a: Attendance) => a.status === 'Late').length || 0,
      overtime: 0, // Overtime tracking not implemented yet
      absent: data?.filter((a: Attendance) => a.status === 'Absent').length || 0,
      totalHours: 0, // Hours calculation not implemented yet
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

