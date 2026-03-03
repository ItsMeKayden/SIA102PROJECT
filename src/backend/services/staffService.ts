import { createClient } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type { Staff, StaffInsert, StaffUpdate, StaffFormData } from '../../types';
import type { Database } from '../../types/database.types';

// Separate non-persisting client used ONLY for creating new auth users.
// signUp() on this client won't overwrite the admin's active session.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ghstchmtdmcssuqpbuwe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc3RjaG10ZG1jc3N1cXBidXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzQxMzcsImV4cCI6MjA4NzUxMDEzN30.L6KQdh4NJbKszr8SUocc9F14tZWizelFT_fIs-BxAPw';
// storageKey must differ from the main client to prevent interference with the admin session
const supabaseSignUp = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-signup-temp' },
});

// Staff Service
// Handles all staff-related database operations :)

// Get all staff members
export const getAllStaff = async (): Promise<{ data: Staff[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get staff by ID
export const getStaffById = async (id: string): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get staff by department
export const getStaffByDepartment = async (department: string): Promise<{ data: Staff[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('department', department)
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get staff by status
export const getStaffByStatus = async (status: string): Promise<{ data: Staff[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('status', status)
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Create new staff member
export const createStaff = async (staffData: StaffFormData): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    // Use the non-persisting client so signUp doesn't replace the admin's session
    const { data: authData, error: authError } = await supabaseSignUp.auth.signUp({
      email: staffData.email,
      password: 'clinika123',
    });

    if (authError) {
      return { data: null, error: `Failed to create user account: ${authError.message}` };
    }

    if (!authData.user) {
      return { data: null, error: 'Failed to create user account' };
    }

    // Transform StaffFormData to StaffInsert
    const insertData: StaffInsert = {
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      specialization: staffData.specialization || null,
      status: staffData.status,
      phone: staffData.phone || null,
      user_id: authData.user.id, // Link to auth user
      user_role: 'staff', // Default role is staff
      duty_status: 'Off Duty', // Default duty status
    };

    const { data, error } = await supabase
      .from('staff')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // If staff record creation fails, best effort: try to clean up auth user
      // (requires service role - may silently fail, but staff record won't exist)
      console.error('Staff record creation failed after auth user was created:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update staff member
export const updateStaff = async (id: string, staffData: StaffFormData): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    // Transform StaffFormData to StaffUpdate
    const updateData: StaffUpdate = {
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      specialization: staffData.specialization || null,
      status: staffData.status,
      phone: staffData.phone || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Delete staff member
export const deleteStaff = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Search staff
export const searchStaff = async (query: string): Promise<{ data: Staff[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .or(`name.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Update duty status for a staff member (e.g. set 'On Duty' when starting an appointment)
export const updateDutyStatus = async (id: string, dutyStatus: string): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update({ duty_status: dutyStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get staff count by status
export const getStaffCountByStatus = async (): Promise<{ 
  data: { total: number; onDuty: number; offDuty: number; onLeave: number } | null; 
  error: string | null 
}> => {
  try {
    const { data: allStaff, error } = await supabase
      .from('staff')
      .select('status');

    if (error) throw error;

    const counts = {
      total: allStaff?.length || 0,
      onDuty: allStaff?.filter((s: { status: string }) => s.status === 'On Duty').length || 0,
      offDuty: allStaff?.filter((s: { status: string }) => s.status === 'Off Duty').length || 0,
      onLeave: allStaff?.filter((s: { status: string }) => s.status === 'On Leave').length || 0,
    };

    return { data: counts, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};
