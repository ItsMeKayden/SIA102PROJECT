import { supabase } from '../../supabase-client';

export interface Staff {
  doctorID: number;
  doctor_name: string;
  department: string;
}

export interface AttendanceRecord {
  id: number;
  doctor_name: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
}

function formatDate(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  return `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
}

function formatTime(raw: string): string {
  if (!raw) return '—';
  return new Date(`1970-01-01T${raw}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function fetchDoctors(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('doctorID, doctor_name, department');

  if (error) {
    console.error('Error fetching doctors:', error.message);
    return [];
  }

  return (data as Staff[]) ?? [];
}

export async function fetchAttendanceRecords(
  doctorID?: number,
  month?: number, // 1–12
  year?: number,
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance')
    .select(
      `
      attendanceID,
      date,
      CheckIn,
      CheckOut,
      doctors (
        doctor_name,
        department
      )
    `,
    )
    .order('date', { ascending: false });

  if (doctorID !== undefined) {
    query = query.eq('doctorID', doctorID);
  }

  // Filter by month and year
  if (month !== undefined && year !== undefined) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    query = query.gte('date', start).lte('date', end);
  } else if (year !== undefined) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error.message);
    console.error('Details:', error);
    return [];
  }

  console.log('Raw attendance data:', data);

  return (data ?? []).map((row: any) => ({
    id: row.attendanceID,
    doctor_name: row.doctors?.doctor_name ?? '—',
    department: row.doctors?.department ?? '—',
    date: formatDate(row.date),
    checkIn: formatTime(row.CheckIn),
    checkOut: formatTime(row.CheckOut),
  }));
}
