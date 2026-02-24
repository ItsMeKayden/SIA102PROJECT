import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { Attendance, AttendanceInsert, AttendanceUpdate } from '../../types';

// Attendance Backend Service
// Handles all attendance-related database operations :)

// Get all attendance records
export const getAllAttendance = async (): Promise<{ data: Attendance[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
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

    const attendanceData: AttendanceInsert = {
      staff_id: staffId,
      date: dateStr,
      time_in: timeStr,
      status: 'Present',
      notes: shift ? `Shift: ${shift}` : null,
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
export const clockOut = async (attendanceId: string): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // Get the attendance record to calculate hours
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', attendanceId)
      .single();

    if (fetchError) throw fetchError;

    // Note: Hours calculation can be implemented when needed
    // Calculate hours worked if needed:
    // const timeIn = new Date(`2000-01-01T${attendance.time_in}`);
    // const timeOut = new Date(`2000-01-01T${timeStr}`);
    // const hoursWorked = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);

    const { data, error } = await supabase
      .from('attendance')
      .update({
        time_out: timeStr,
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
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
