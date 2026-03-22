import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import { createNotification } from './notificationService';
import type {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  ScheduleSwapRequest,
  ScheduleSwapRequestInsert,
} from '../../types';

// Schedule Service
// Handles all schedule-related database operations :)

const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type ShiftSession = 'AM' | 'PM';

export type SessionWindow = { start: string; end: string };
export type SessionSettings = Record<ShiftSession, SessionWindow>;

const DEFAULT_SESSION_WINDOWS: SessionSettings = {
  AM: { start: '08:00', end: '12:00' },
  PM: { start: '13:00', end: '17:00' },
};

const isValidTime = (value: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const normalizeSettings = (settings: Partial<SessionSettings> | null | undefined): SessionSettings => {
  const result: SessionSettings = {
    AM: { ...DEFAULT_SESSION_WINDOWS.AM },
    PM: { ...DEFAULT_SESSION_WINDOWS.PM },
  };

  if (!settings) return result;

  (['AM', 'PM'] as const).forEach((session) => {
    const candidate = settings[session];
    if (!candidate) return;
    if (isValidTime(candidate.start) && isValidTime(candidate.end) && candidate.start < candidate.end) {
      result[session] = {
        start: candidate.start,
        end: candidate.end,
      };
    }
  });

  return result;
};

const normalizeDbTime = (value: string): string => value.slice(0, 5);

let currentSessionWindows: SessionSettings = {
  AM: { ...DEFAULT_SESSION_WINDOWS.AM },
  PM: { ...DEFAULT_SESSION_WINDOWS.PM },
};

const normalizeSession = (value?: string | null): ShiftSession => {
  if (value === 'PM') return 'PM';
  return 'AM';
};

export const getSessionSettings = (): SessionSettings => ({
  AM: { ...currentSessionWindows.AM },
  PM: { ...currentSessionWindows.PM },
});

const persistSessionSettings = async (settings: SessionSettings): Promise<string | null> => {
  try {
    const payload = [
      {
        session_name: 'AM' as ShiftSession,
        start_time: settings.AM.start,
        end_time: settings.AM.end,
        updated_at: new Date().toISOString(),
      },
      {
        session_name: 'PM' as ShiftSession,
        start_time: settings.PM.start,
        end_time: settings.PM.end,
        updated_at: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from('session_settings')
      .upsert(payload, { onConflict: 'session_name' });
    if (error) throw error;
    return null;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const loadSessionSettings = async (): Promise<{ data: SessionSettings; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('session_settings')
      .select('session_name, start_time, end_time')
      .in('session_name', ['AM', 'PM']);
    if (error) throw error;

    if (!data || data.length === 0) {
      const seedError = await persistSessionSettings(DEFAULT_SESSION_WINDOWS);
      if (seedError) {
        currentSessionWindows = normalizeSettings(DEFAULT_SESSION_WINDOWS);
        return { data: getSessionSettings(), error: seedError };
      }
      currentSessionWindows = normalizeSettings(DEFAULT_SESSION_WINDOWS);
      return { data: getSessionSettings(), error: null };
    }

    const partial: Partial<SessionSettings> = {};
    for (const row of data) {
      const sessionName = String(row.session_name);
      if (sessionName === 'AM' || sessionName === 'PM') {
        partial[sessionName] = {
          start: normalizeDbTime(row.start_time),
          end: normalizeDbTime(row.end_time),
        };
      }
    }

    currentSessionWindows = normalizeSettings(partial);
    return { data: getSessionSettings(), error: null };
  } catch (error) {
    currentSessionWindows = normalizeSettings(DEFAULT_SESSION_WINDOWS);
    return { data: getSessionSettings(), error: handleSupabaseError(error) };
  }
};

export const updateSessionSettings = async (settings: SessionSettings): Promise<{ data: SessionSettings; error: string | null }> => {
  const next = normalizeSettings(settings);
  const error = await persistSessionSettings(next);
  if (error) {
    return { data: getSessionSettings(), error };
  }
  currentSessionWindows = next;
  return { data: getSessionSettings(), error: null };
};

export const getSessionWindow = (session: ShiftSession) => currentSessionWindows[session];

export const resolveScheduleSession = (schedule: Pick<Schedule, 'shift_session' | 'start_time'>): ShiftSession => {
  if (schedule.shift_session === 'AM' || schedule.shift_session === 'PM') {
    return schedule.shift_session;
  }
  return schedule.start_time < '12:00' ? 'AM' : 'PM';
};

const toNormalizedInsert = (scheduleData: ScheduleInsert): ScheduleInsert => {
  const session = normalizeSession(scheduleData.shift_session ?? null);
  const window = getSessionWindow(session);
  return {
    ...scheduleData,
    shift_session: session,
    start_time: window.start,
    end_time: window.end,
  };
};

const toNormalizedUpdate = (scheduleData: ScheduleUpdate): ScheduleUpdate => {
  const session = scheduleData.shift_session ? normalizeSession(scheduleData.shift_session) : null;
  if (!session) return scheduleData;
  const window = getSessionWindow(session);
  return {
    ...scheduleData,
    shift_session: session,
    start_time: window.start,
    end_time: window.end,
  };
};

const getNextOccurrenceDate = (dayOfWeek: number): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = (dayOfWeek - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + offset);
  return next;
};

const isSwapBeforeRunAllowed = (dayOfWeek: number): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const runDate = getNextOccurrenceDate(dayOfWeek);
  return runDate.getTime() > today.getTime();
};

const isSwapPairBeforeRunAllowed = (fromDayOfWeek: number, toDayOfWeek: number): boolean => {
  return isSwapBeforeRunAllowed(fromDayOfWeek) && isSwapBeforeRunAllowed(toDayOfWeek);
};

const notifyDoctorNewSchedule = async (staffId: string) => {
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
      title: 'New schedule',
      message: 'You have a new schedule. Please check your schedule tab.',
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
      .order('shift_session', { ascending: true })
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
      .order('shift_session', { ascending: true })
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
      .order('shift_session', { ascending: true })
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
    const normalized = toNormalizedInsert(scheduleData);
    const { data, error } = await supabase
      .from('schedules')
      .insert(normalized)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      // Notify the staff (doctors) that a new schedule was added to their account
      void notifyDoctorNewSchedule(data.staff_id);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update schedule
export const updateSchedule = async (id: string, scheduleData: ScheduleUpdate): Promise<{ data: Schedule | null; error: string | null }> => {
  try {
    const normalized = toNormalizedUpdate(scheduleData);
    const { data, error } = await supabase
      .from('schedules')
      .update({ ...normalized, updated_at: new Date().toISOString() })
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
      .order('shift_session', { ascending: true })
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
    const normalized = scheduleDataArray.map(toNormalizedInsert);

    // Insert rows and return inserted records to allow follow-up notifications
    const { data, error } = await supabase.from('schedules').insert(normalized).select();
    if (error) throw error;

    // Notify doctors about their new schedules
    const inserted = data as Schedule[];
    const doctorIds = Array.from(
      new Set(
        inserted.map((s) => s.staff_id).filter(Boolean),
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

      for (const doctorId of doctorIdSet) {
        void notifyDoctorNewSchedule(doctorId);
      }
    }

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

export type ScheduleSwapRequestWithDetails = ScheduleSwapRequest & {
  requested_by?: { id: string; name: string; role: string };
  approved_by?: { id: string; name: string; role: string };
  from_schedule?: Schedule & { staff?: { id: string; name: string; role: string } };
  to_schedule?: Schedule & { staff?: { id: string; name: string; role: string } };
};

export const getScheduleSwapRequests = async (options?: {
  status?: 'pending' | 'approved' | 'rejected';
  requestedByStaffId?: string;
}): Promise<{ data: ScheduleSwapRequestWithDetails[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('schedule_swap_requests')
      .select(`
        *,
        requested_by:requested_by_staff_id(id, name, role),
        approved_by:approved_by_staff_id(id, name, role),
        from_schedule:from_schedule_id(
          *,
          staff:staff_id(id, name, role)
        ),
        to_schedule:to_schedule_id(
          *,
          staff:staff_id(id, name, role)
        )
      `)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.requestedByStaffId) {
      query = query.eq('requested_by_staff_id', options.requestedByStaffId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as unknown as ScheduleSwapRequestWithDetails[], error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const createScheduleSwapRequest = async (params: {
  requestedByStaffId: string;
  fromScheduleId: string;
  toScheduleId: string;
  reason?: string | null;
}): Promise<{ data: ScheduleSwapRequest | null; error: string | null }> => {
  try {
    const { data: requester, error: requesterError } = await supabase
      .from('staff')
      .select('id, role, name')
      .eq('id', params.requestedByStaffId)
      .single();
    if (requesterError || !requester) throw requesterError;

    if (!/doctor|physician/i.test(requester.role || '')) {
      return { data: null, error: 'Only doctors can request schedule swaps.' };
    }

    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .in('id', [params.fromScheduleId, params.toScheduleId])
      .eq('is_active', true);

    if (schedulesError) throw schedulesError;
    if (schedules?.length !== 2) {
      return { data: null, error: 'Both schedules must exist and be active.' };
    }

    const fromSchedule = schedules.find((s) => s.id === params.fromScheduleId);
    const toSchedule = schedules.find((s) => s.id === params.toScheduleId);
    if (!fromSchedule || !toSchedule) {
      return { data: null, error: 'Invalid schedule selection for swap.' };
    }

    if (fromSchedule.staff_id !== params.requestedByStaffId) {
      return { data: null, error: 'You can only request a swap from your own schedule.' };
    }

    if (fromSchedule.staff_id === toSchedule.staff_id) {
      return { data: null, error: 'Please select another doctor schedule to swap with.' };
    }

    const fromSession = resolveScheduleSession(fromSchedule);
    const toSession = resolveScheduleSession(toSchedule);

    if (!isSwapPairBeforeRunAllowed(fromSchedule.day_of_week, toSchedule.day_of_week)) {
      return { data: null, error: 'Swapping must happen beforehand. You cannot request swap on the same day of either schedule.' };
    }

    const { data: pending } = await supabase
      .from('schedule_swap_requests')
      .select('id')
      .eq('status', 'pending')
      .or(
        `and(from_schedule_id.eq.${params.fromScheduleId},to_schedule_id.eq.${params.toScheduleId}),and(from_schedule_id.eq.${params.toScheduleId},to_schedule_id.eq.${params.fromScheduleId})`,
      )
      .limit(1);

    if ((pending?.length ?? 0) > 0) {
      return { data: null, error: 'A pending swap request already exists for these schedules.' };
    }

    const insertData: ScheduleSwapRequestInsert = {
      requested_by_staff_id: params.requestedByStaffId,
      from_schedule_id: params.fromScheduleId,
      to_schedule_id: params.toScheduleId,
      status: 'pending',
      reason: params.reason ?? null,
    };

    const { data, error } = await supabase
      .from('schedule_swap_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const { data: admins } = await supabase
      .from('staff')
      .select('id')
      .eq('user_role', 'admin');

    if (admins?.length) {
      for (const admin of admins) {
        void createNotification({
          staff_id: admin.id,
          title: 'Schedule swap request pending',
          message: `${requester.name} requested a swap: ${weekDaysFull[fromSchedule.day_of_week]} ${fromSession} ↔ ${weekDaysFull[toSchedule.day_of_week]} ${toSession}.`,
          type: 'warning',
        });
      }
    }

    void createNotification({
      staff_id: toSchedule.staff_id,
      title: 'Swap request received',
      message: `${requester.name} requested to swap ${weekDaysFull[fromSchedule.day_of_week]} ${fromSession} with your ${weekDaysFull[toSchedule.day_of_week]} ${toSession}. Awaiting admin approval.`,
      type: 'info',
    });

    return { data: data as ScheduleSwapRequest, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const approveScheduleSwapRequest = async (
  requestId: string,
  adminStaffId: string,
): Promise<{ error: string | null }> => {
  try {
    const { data: reqData, error: reqError } = await supabase
      .from('schedule_swap_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();
    if (reqError || !reqData) throw reqError;

    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .in('id', [reqData.from_schedule_id, reqData.to_schedule_id])
      .eq('is_active', true);
    if (schedulesError) throw schedulesError;
    if (schedules?.length !== 2) {
      return { error: 'Cannot approve: schedule entries are missing or inactive.' };
    }

    const fromSchedule = schedules.find((s) => s.id === reqData.from_schedule_id);
    const toSchedule = schedules.find((s) => s.id === reqData.to_schedule_id);
    if (!fromSchedule || !toSchedule) {
      return { error: 'Cannot approve: invalid schedule data.' };
    }

    if (!isSwapPairBeforeRunAllowed(fromSchedule.day_of_week, toSchedule.day_of_week)) {
      return { error: 'Cannot approve now. Swaps must be approved before the date of both schedules.' };
    }

    const fromStaffId = fromSchedule.staff_id;
    const toStaffId = toSchedule.staff_id;

    const { error: updateFromError } = await supabase
      .from('schedules')
      .update({
        staff_id: toStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fromSchedule.id);
    if (updateFromError) throw updateFromError;

    const { error: updateToError } = await supabase
      .from('schedules')
      .update({
        staff_id: fromStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', toSchedule.id);
    if (updateToError) throw updateToError;

    const nowIso = new Date().toISOString();
    const { error: finalizeError } = await supabase
      .from('schedule_swap_requests')
      .update({
        status: 'approved',
        approved_by_staff_id: adminStaffId,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', requestId);
    if (finalizeError) throw finalizeError;

    void createNotification({
      staff_id: fromStaffId,
      title: 'Swap request approved',
      message: `Your schedule swap request has been approved by admin.`,
      type: 'success',
    });
    void createNotification({
      staff_id: toStaffId,
      title: 'Schedule swap approved',
      message: `A schedule swap involving one of your schedules was approved.`,
      type: 'success',
    });

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

export const rejectScheduleSwapRequest = async (
  requestId: string,
  adminStaffId: string,
  decisionNotes?: string,
): Promise<{ error: string | null }> => {
  try {
    const nowIso = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from('schedule_swap_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();
    if (existingError || !existing) throw existingError;

    const { error } = await supabase
      .from('schedule_swap_requests')
      .update({
        status: 'rejected',
        approved_by_staff_id: adminStaffId,
        decision_notes: decisionNotes ?? null,
        rejected_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', requestId);

    if (error) throw error;

    void createNotification({
      staff_id: existing.requested_by_staff_id,
      title: 'Swap request rejected',
      message: decisionNotes
        ? `Your swap request was rejected: ${decisionNotes}`
        : 'Your swap request was rejected by admin.',
      type: 'error',
    });

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

