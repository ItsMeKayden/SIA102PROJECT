import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { Attendance, AttendanceInsert, AttendanceUpdate, NotificationInsert } from '../../types';
import { createNotification } from './notificationService';
import { isWithinClinicPremises, calculateDistance, CLINIC_LOCATION } from '../../lib/locationUtils';

/**
 * Get today's date in local timezone (not UTC)
 * Fixes timezone issues where UTC date may be one day behind local date
 */
const getTodayDateString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Attendance Backend Service
// Handles all attendance-related database operations :)

// Helper function to get day of week (0 = Sunday, 1 = Monday, etc.)
const getDayOfWeek = (dateStr: string): number => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
};

// Helper function to get all admin users
const getAllAdmins = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id')
      .eq('user_role', 'admin');

    if (error) {
      console.error('Error fetching admins:', error);
      return [];
    }

    return (data || []).map((admin: { id: string }) => admin.id);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
};

// Helper function to get staff name by ID
const getStaffName = async (staffId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('name')
      .eq('id', staffId)
      .single();

    if (error) {
      console.error('Error fetching staff name:', error);
      return null;
    }

    return data?.name || null;
  } catch (error) {
    console.error('Error fetching staff name:', error);
    return null;
  }
};

// Helper function to send clock in notification
const sendClockInNotification = async (staffId: string, staffName: string): Promise<void> => {
  try {
    // Send notification to the staff member
    await createNotification({
      title: 'Clock In Successful',
      message: `You have successfully clocked in at ${new Date().toLocaleTimeString()}`,
      staff_id: staffId,
      type: 'success',
    });

    // Get all admins and send them notifications
    const admins = await getAllAdmins();
    for (const adminId of admins) {
      await createNotification({
        title: `${staffName} Clocked In`,
        message: `${staffName} has clocked in at ${new Date().toLocaleTimeString()}`,
        staff_id: adminId,
        type: 'info',
      });
    }
  } catch (error) {
    console.error('Error sending clock in notification:', error);
  }
};

// Helper function to send clock out notification
const sendClockOutNotification = async (staffId: string, staffName: string): Promise<void> => {
  try {
    // Send notification to the staff member
    await createNotification({
      title: 'Clock Out Successful',
      message: `You have successfully clocked out at ${new Date().toLocaleTimeString()}`,
      staff_id: staffId,
      type: 'success',
    });

    // Get all admins and send them notifications
    const admins = await getAllAdmins();
    for (const adminId of admins) {
      await createNotification({
        title: `${staffName} Clocked Out`,
        message: `${staffName} has clocked out at ${new Date().toLocaleTimeString()}`,
        staff_id: adminId,
        type: 'info',
      });
    }
  } catch (error) {
    console.error('Error sending clock out notification:', error);
  }
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
export const clockIn = async (
  staffId: string,
  shift?: string,
  currentUserId?: string,
  latitude?: number,
  longitude?: number
): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    // Validate that the current user is either the staff member clocking in or is an admin
    if (currentUserId && currentUserId !== staffId) {
      // Check if current user is admin
      const { data: currentUserStaff, error: userCheckError } = await supabase
        .from('staff')
        .select('user_role')
        .eq('id', currentUserId)
        .single();

      if (userCheckError || !currentUserStaff || currentUserStaff.user_role !== 'admin') {
        return {
          data: null,
          error: 'You can only clock in/out for yourself. Contact an administrator for manual entries.',
        };
      }
    }

    const now = new Date();
    const dateStr = getTodayDateString();
    const timeStr = now.toTimeString().split(' ')[0];

    // Check if staff has a schedule for today
    const schedule = await getStaffScheduleForDate(staffId, dateStr);

    // Determine status based on schedule
    let status = 'On-Call'; // Default to On-Call if not scheduled
    let notes = shift ? `Shift: ${shift}` : null;

    if (schedule) {
      // Staff is scheduled - determine if Present or Late
      status = 'Present';
      if (isStaffLate(timeStr, schedule.start_time)) {
        status = 'Late';
        notes = shift ? `Shift: ${shift} (Late)` : 'Late';
      }
    } else {
      // Staff is not scheduled - set to On-Call
      notes = shift ? `Shift: ${shift} (On-Call)` : 'On-Call';
    }

    // Determine if clock in is within clinic premises
    let clockInWithinPremises = null;
    if (latitude !== undefined && longitude !== undefined) {
      clockInWithinPremises = isWithinClinicPremises(latitude, longitude);
    }

    const attendanceData: any = {
      staff_id: staffId,
      date: dateStr,
      time_in: timeStr,
      status,
      notes,
      clock_in_latitude: latitude ?? null,
      clock_in_longitude: longitude ?? null,
      clock_in_within_premises: clockInWithinPremises,
    };

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;

    // Send notifications on successful clock in
    const staffName = await getStaffName(staffId);
    if (staffName) {
      await sendClockInNotification(staffId, staffName);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Clock out
export const clockOut = async (
  staffId: string,
  currentUserId?: string,
  latitude?: number,
  longitude?: number
): Promise<{ data: Attendance | null; error: string | null }> => {
  try {
    // Validate that the current user is either the staff member clocking out or is an admin
    if (currentUserId && currentUserId !== staffId) {
      // Check if current user is admin
      const { data: currentUserStaff, error: userCheckError } = await supabase
        .from('staff')
        .select('user_role')
        .eq('id', currentUserId)
        .single();

      if (userCheckError || !currentUserStaff || currentUserStaff.user_role !== 'admin') {
        return {
          data: null,
          error: 'You can only clock out for yourself. Contact an administrator for manual entries.',
        };
      }
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = getTodayDateString();

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

    // Determine if clock out is within clinic premises
    let clockOutWithinPremises = null;
    if (latitude !== undefined && longitude !== undefined) {
      clockOutWithinPremises = isWithinClinicPremises(latitude, longitude);
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        time_out: timeStr,
        clock_out_latitude: latitude ?? null,
        clock_out_longitude: longitude ?? null,
        clock_out_within_premises: clockOutWithinPremises,
      })
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (error) throw error;

    // Send notifications on successful clock out
    const staffName = await getStaffName(staffId);
    if (staffName) {
      await sendClockOutNotification(staffId, staffName);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Check if staff is already clocked in today
export const isStaffClockedIn = async (staffId: string): Promise<{ isClockedIn: boolean; error: string | null }> => {
  try {
    const now = new Date();
    const dateStr = getTodayDateString();

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

