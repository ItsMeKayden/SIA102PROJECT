// Export database types
export type { Database } from './database.types';
import type { Database } from './database.types';

// Staff types
export type Staff = Database['public']['Tables']['staff']['Row'];
export type StaffInsert = Database['public']['Tables']['staff']['Insert'];
export type StaffUpdate = Database['public']['Tables']['staff']['Update'];

// Attendance types
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

// Appointment types
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

// Schedule types
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

// Notification types
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// UI specific types
export interface StaffFormData {
  name: string;
  role: string;
  specialization: string;
  status: 'Active' | 'Inactive';
  email: string;
  phone?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  shift: string;
  hours: string;
  status: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  time: string;
}

export interface UpcomingAppointment {
  id: string;
  patient: string;
  doctor: string;
  time: string;
}
