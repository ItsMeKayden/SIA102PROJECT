import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { AnalyticsStats } from '../../types';

/**
 * Helper function to safely parse date strings and extract month/year
 * DATE fields from Supabase come back as "YYYY-MM-DD" strings
 */
const getMonthYearFromDateString = (dateStr: string): string => {
  try {
    // Parse YYYY-MM-DD format directly without Date object to avoid timezone issues
    const [year, month] = dateStr.split('-');
    const monthIndex = parseInt(month);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[monthIndex - 1]} ${year}`;
  } catch {
    return '';
  }
};

/**
 * Fetches the numbers needed by the analytics/dashboards.
 *
 * The values are derived from the existing tables rather than stored
 * in a dedicated "analytics" table; everything can be computed with
 * simple aggregates.
 */
export const getAnalyticsStats = async (monthYear?: string): Promise<{ data: AnalyticsStats | null; error: string | null }> => {
  try {
    // 1. total consultations = total number of completed appointments
    const { data: allAppts, error: apptError } = await supabase
      .from('appointments')
      .select('*');

    if (apptError) throw apptError;

    // Filter by month if provided
    let filteredAppts = allAppts || [];
    if (monthYear && filteredAppts.length > 0) {
      filteredAppts = filteredAppts.filter((appt: any) => {
        if (!appt.appointment_date) return false;
        const month = getMonthYearFromDateString(appt.appointment_date);
        return month === monthYear;
      });
    }

    // Only count completed appointments
    const totalConsultations = filteredAppts.filter((appt: any) => appt.status === 'Completed').length;

    // 2. average patients per doctor = total consultations / number of doctors
    const { data: doctorRes, error: docError } = await supabase
      .from('staff')
      .select('id')
      .eq('role', 'Doctor');

    if (docError) throw docError;
    const doctorCount = doctorRes?.length ?? 0;
    const avgPatientsPerDoctor = doctorCount > 0 ? totalConsultations / doctorCount : 0;

    // 3. patient return rate = percentage of returning patients out of all patients (only from completed appointments)
    const patientCounts: { [name: string]: number } = {};
    filteredAppts
      .filter((appt: any) => appt.status === 'Completed' && appt.patient_name)
      .forEach((appt: any) => {
        patientCounts[appt.patient_name] = (patientCounts[appt.patient_name] || 0) + 1;
      });
    const totalPatients = Object.keys(patientCounts).length;
    const returningPatients = Object.values(patientCounts).filter(count => count > 1).length;
    const patientReturnRate = totalPatients > 0 ? (returningPatients / totalPatients) * 100 : 0;

    // 4. attendance rate calculation:
    // - Present = 1.0 (full attendance)
    // - Late = 0.5 (half attendance)
    // - Absent, On-Call, Pending = 0 (not counted but included in total)
    const { data: attendanceAll, error: attendanceError } = await supabase
      .from('attendance')
      .select('status, date');

    if (attendanceError) throw attendanceError;
    
    let filteredAttendance = attendanceAll || [];
    if (monthYear) {
      filteredAttendance = filteredAttendance.filter(record => {
        const month = getMonthYearFromDateString(record.date);
        return month === monthYear;
      });
    }

    // Count attendance points: Present = 1.0, Late = 0.5, others = 0
    const presentCount = filteredAttendance.filter(a => a.status === 'Present').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'Late').length;
    const totalRecords = filteredAttendance.length;
    
    // Calculate attendance rate: (Present + Late*0.5) / Total
    const attendancePointsTotal = presentCount * 1.0 + lateCount * 0.5;
    const attendanceRate = totalRecords > 0 ? (attendancePointsTotal / totalRecords) * 100 : 0;

    // Build patient appointment list and returning patients list for completeness
    const patientAppointmentList = Object.entries(patientCounts).map(([name, count]) => ({ name, count }));
    const returningPatientsList = patientAppointmentList.filter(({ count }) => count > 1).map(({ name }) => name);

    return {
      data: {
        totalConsultations,
        avgPatientsPerDoctor,
        patientReturnRate,
        attendanceRate,
        patientAppointmentList,
        returningPatientsList,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetches monthly consultation counts for patient visit trends chart.
 */
export const getMonthlyConsultations = async (): Promise<{ data: { month: string, count: number }[] | null; error: string | null }> => {
  try {
    // Group completed appointments by month and count
    const { data, error } = await supabase
      .from('appointments')
      .select('*');

    if (error) throw error;

    // Aggregate counts by month (only completed appointments)
    const monthCounts: { [key: string]: number } = {};
    data?.forEach((appt: any) => {
      if (appt.status !== 'Completed' || !appt.appointment_date) return;
      const month = getMonthYearFromDateString(appt.appointment_date);
      if (month) {
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    // Convert to array sorted by date
    const result = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month) > new Date(b.month) ? 1 : -1);

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetches all appointment patient names for returning patient calculation.
 */
export const getAllAppointments = async (): Promise<{ data: { patient_name: string }[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('patient_name');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetches monthly performance index based on all analytics metrics.
 * Combines consultations, patient return rate, and attendance rate by month.
 */
export const getMonthlyPerformance = async (monthYear?: string): Promise<{ data: { month: string, value: number }[] | null; error: string | null }> => {
  try {
    // Get completed appointments for consultations and patient returns by month
    const { data: allAppts, error: apptError } = await supabase
      .from('appointments')
      .select('*');
    if (apptError) throw apptError;

    // Get all attendance records by month
    const { data: attendanceAll, error: attendanceError } = await supabase
      .from('attendance')
      .select('*');
    if (attendanceError) throw attendanceError;

    // Calculate metrics by month
    const monthlyMetrics: { [month: string]: { consultations: number; returnPatients: number; uniquePatients: number; attended: number; total: number } } = {};

    // Group completed appointments by month
    allAppts?.forEach((appt: any) => {
      if (appt.status !== 'Completed' || !appt.appointment_date) return;
      const month = getMonthYearFromDateString(appt.appointment_date);
      if (month) {
        if (!monthlyMetrics[month]) {
          monthlyMetrics[month] = { consultations: 0, returnPatients: 0, uniquePatients: 0, attended: 0, total: 0 };
        }
        monthlyMetrics[month].consultations += 1;
      }
    });

    // Calculate patient return rate per month
    Object.keys(monthlyMetrics).forEach(month => {
      const appts = allAppts?.filter(a => {
        const aMonth = getMonthYearFromDateString(a.appointment_date);
        return aMonth === month;
      }) ?? [];
      
      const patientCounts: { [name: string]: number } = {};
      appts.forEach(appt => {
        patientCounts[appt.patient_name] = (patientCounts[appt.patient_name] || 0) + 1;
      });
      
      monthlyMetrics[month].uniquePatients = Object.keys(patientCounts).length;
      monthlyMetrics[month].returnPatients = Object.values(patientCounts).filter(count => count > 1).length;
    });

    // Calculate attendance rate per month
    attendanceAll?.forEach((record: { date: string; status: string }) => {
      const month = getMonthYearFromDateString(record.date);
      if (month) {
        if (!monthlyMetrics[month]) {
          monthlyMetrics[month] = { consultations: 0, returnPatients: 0, uniquePatients: 0, attended: 0, total: 0 };
        }
        monthlyMetrics[month].total += 1;
        if (record.status === 'Present') {
          monthlyMetrics[month].attended += 1;
        }
      }
    });

    // Calculate performance index for each month
    const allConsultations = Object.values(monthlyMetrics).reduce((sum, m) => sum + m.consultations, 0);
    const avgConsultations = allConsultations / Object.keys(monthlyMetrics).length || 1;

    let performanceData = Object.entries(monthlyMetrics)
      .map(([month, metrics]) => {
        // Normalize each metric to 0-100
        const consultationScore = (metrics.consultations / avgConsultations) * 100;
        const patientReturnScore = metrics.uniquePatients > 0 ? (metrics.returnPatients / metrics.uniquePatients) * 100 : 0;
        const attendanceScore = metrics.total > 0 ? (metrics.attended / metrics.total) * 100 : 0;
        
        // Combine scores (weight: consultations 40%, return rate 30%, attendance 30%)
        const combinedScore = (consultationScore * 0.4 + patientReturnScore * 0.3 + attendanceScore * 0.3);
        
        return {
          month,
          value: Math.round(combinedScore),
        };
      })
      .sort((a, b) => new Date(a.month) > new Date(b.month) ? 1 : -1);

    // Filter by selected month if provided
    if (monthYear) {
      performanceData = performanceData.filter(item => item.month === monthYear);
    }

    return { data: performanceData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetches weekly performance data for a specific month.
 * Breaks down the monthly performance index by weeks within that month.
 */
export const getWeeklyPerformance = async (monthYear: string): Promise<{ data: { week: string, value: number }[] | null; error: string | null }> => {
  try {
    // Get completed appointments for consultations and patient returns
    const { data: allAppts, error: apptError } = await supabase
      .from('appointments')
      .select('*');
    if (apptError) throw apptError;

    // Get all attendance records
    const { data: attendanceAll, error: attendanceError } = await supabase
      .from('attendance')
      .select('*');
    if (attendanceError) throw attendanceError;

    // Calculate metrics by week
    const weeklyMetrics: { [week: string]: { consultations: number; returnPatients: number; uniquePatients: number; attended: number; total: number } } = {};

    // Helper function to get week number and validate month
    const getWeekInfo = (dateStr: string): { weekNum: number; isInMonth: boolean } | null => {
      const [monthStr, yearStr] = monthYear.split(' ');
      
      try {
        // Parse date string YYYY-MM-DD
        const [dateYear, dateMonth, dateDay] = dateStr.split('-');
        
        // Get month names
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dateMonthName = monthNames[parseInt(dateMonth) - 1];
        
        // Check if date is in the selected month
        if (dateMonthName !== monthStr || dateYear !== yearStr) {
          return null;
        }
        
        // Calculate week number (1-4 for weeks in the month)
        const day = parseInt(dateDay);
        const weekNum = Math.ceil((day + new Date(`${dateYear}-${dateMonth}-01`).getDay()) / 7);
        return { weekNum, isInMonth: true };
      } catch {
        return null;
      }
    };

    // Group completed appointments by week
    allAppts?.forEach((appt: any) => {
      if (appt.status !== 'Completed' || !appt.appointment_date) return;
      const weekInfo = getWeekInfo(appt.appointment_date);
      if (weekInfo) {
        const weekLabel = `Week ${weekInfo.weekNum}`;
        if (!weeklyMetrics[weekLabel]) {
          weeklyMetrics[weekLabel] = { consultations: 0, returnPatients: 0, uniquePatients: 0, attended: 0, total: 0 };
        }
        weeklyMetrics[weekLabel].consultations += 1;
      }
    });

    // Calculate patient return rate per week
    Object.keys(weeklyMetrics).forEach(week => {
      const appts = allAppts?.filter((a: any) => {
        if (a.status !== 'Completed' || !a.appointment_date) return false;
        const weekInfo = getWeekInfo(a.appointment_date);
        return weekInfo && `Week ${weekInfo.weekNum}` === week;
      }) ?? [];
      
      const patientCounts: { [name: string]: number } = {};
      appts.forEach((appt: any) => {
        if (appt.patient_name) {
          patientCounts[appt.patient_name] = (patientCounts[appt.patient_name] || 0) + 1;
        }
      });
      
      weeklyMetrics[week].uniquePatients = Object.keys(patientCounts).length;
      weeklyMetrics[week].returnPatients = Object.values(patientCounts).filter(count => count > 1).length;
    });

    // Calculate attendance rate per week
    attendanceAll?.forEach((record: { date: string; status: string }) => {
      const weekInfo = getWeekInfo(record.date);
      if (weekInfo) {
        const weekLabel = `Week ${weekInfo.weekNum}`;
        if (!weeklyMetrics[weekLabel]) {
          weeklyMetrics[weekLabel] = { consultations: 0, returnPatients: 0, uniquePatients: 0, attended: 0, total: 0 };
        }
        weeklyMetrics[weekLabel].total += 1;
        if (record.status === 'Present') {
          weeklyMetrics[weekLabel].attended += 1;
        }
      }
    });

    // Calculate performance index for each week
    const allConsultations = Object.values(weeklyMetrics).reduce((sum, m) => sum + m.consultations, 0);
    const avgConsultations = allConsultations / Object.keys(weeklyMetrics).length || 1;
    
    // Calculate average return rate and attendance rate for normalization
    const totalUniquePatients = Object.values(weeklyMetrics).reduce((sum, m) => sum + m.uniquePatients, 0);
    const totalReturningPatients = Object.values(weeklyMetrics).reduce((sum, m) => sum + m.returnPatients, 0);
    const avgReturnRate = totalUniquePatients > 0 ? (totalReturningPatients / totalUniquePatients) * 100 : 0;
    
    const totalAttendance = Object.values(weeklyMetrics).reduce((sum, m) => sum + m.total, 0);
    const totalPresent = Object.values(weeklyMetrics).reduce((sum, m) => sum + m.attended, 0);
    const avgAttendanceRate = totalAttendance > 0 ? (totalPresent / totalAttendance) * 100 : 0;

    const performanceData = Object.entries(weeklyMetrics)
      .map(([week, metrics]) => {
        // Normalize each metric relative to the average
        const consultationScore = metrics.consultations > 0 ? (metrics.consultations / avgConsultations) * 100 : 0;
        
        // Patient return rate for this week
        const weekReturnRate = metrics.uniquePatients > 0 ? (metrics.returnPatients / metrics.uniquePatients) * 100 : 0;
        const patientReturnScore = avgReturnRate > 0 ? (weekReturnRate / avgReturnRate) * 100 : 0;
        
        // Attendance rate for this week
        const weekAttendanceRate = metrics.total > 0 ? (metrics.attended / metrics.total) * 100 : 0;
        const attendanceScore = avgAttendanceRate > 0 ? (weekAttendanceRate / avgAttendanceRate) * 100 : 0;
        
        // Combine scores (weight: consultations 40%, return rate 30%, attendance 30%)
        const combinedScore = (consultationScore * 0.4 + patientReturnScore * 0.3 + attendanceScore * 0.3);
        
        return {
          week,
          value: Math.round(combinedScore),
        };
      })
      .sort((a, b) => {
        const weekA = parseInt(a.week.replace('Week ', ''));
        const weekB = parseInt(b.week.replace('Week ', ''));
        return weekA - weekB;
      });

    return { data: performanceData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

