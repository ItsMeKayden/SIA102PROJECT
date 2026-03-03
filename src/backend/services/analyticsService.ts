import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { AnalyticsStats } from '../../types';

/**
 * Fetches the numbers needed by the analytics/dashboards.
 *
 * The values are derived from the existing tables rather than stored
 * in a dedicated "analytics" table; everything can be computed with
 * simple aggregates.
 */
export const getAnalyticsStats = async (): Promise<{ data: AnalyticsStats | null; error: string | null }> => {
  try {
    // 1. total consultations = total number of completed appointments
    const { data: allAppts, error: apptError } = await supabase
      .from('appointments')
      .select('status');

    if (apptError) throw apptError;

    const totalConsultations = allAppts?.filter(a => a.status === 'Completed').length ?? 0;

    // 2. average patients per doctor = total consultations / number of doctors
    const { data: doctorCountRes, error: docError } = await supabase
      .from('staff')
      .select('id', { count: 'exact' })
      .eq('role', 'Doctor');

    if (docError) throw docError;
    const doctorCount = doctorCountRes?.length ?? 0;
    const avgPatientsPerDoctor = doctorCount > 0 ? totalConsultations / doctorCount : 0;

    // 3. nurse assistance count = number of attendance records belonging to nurses
    // first fetch nurse ids
    const { data: nurseStaff, error: nurseError } = await supabase
      .from('staff')
      .select('id')
      .eq('role', 'Nurse');

    if (nurseError) throw nurseError;
const nurseIds = nurseStaff?.map((s: { id: string }) => s.id) ?? [];

    let nurseAssistanceCount = 0;
    if (nurseIds.length > 0) {
      const { data: nurseAttend, error: attendError } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .in('staff_id', nurseIds);
      if (attendError) throw attendError;
      nurseAssistanceCount = nurseAttend?.length ?? 0;
    }

    // 4. attendance rate = present / total
    const { data: attendanceAll, error: attendanceError } = await supabase
      .from('attendance')
      .select('status');

    if (attendanceError) throw attendanceError;
    const totalAttend = attendanceAll?.length ?? 0;
    const presentCount = attendanceAll?.filter(a => a.status === 'Present').length ?? 0;
    const attendanceRate = totalAttend > 0 ? (presentCount / totalAttend) * 100 : 0;

    return {
      data: {
        totalConsultations,
        avgPatientsPerDoctor,
        nurseAssistanceCount,
        attendanceRate,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};
