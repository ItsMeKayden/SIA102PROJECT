import { createClient } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../../lib/supabase-client';
import type {
  Staff,
  StaffInsert,
  StaffUpdate,
  StaffFormData,
} from '../../types';

export interface Service {
  serviceID: string;
  serviceName: string;
  category: string;
  duration: string;
  price: number;
  downpayment: number;
  status: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFormData {
  serviceName: string;
  category: string;
  duration: string;
  price: number;
  downpayment: number;
  status: 'Available' | 'Unavailable';
  description: string;
}

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ghstchmtdmcssuqpbuwe.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc3RjaG10ZG1jc3N1cXBidXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzQxMzcsImV4cCI6MjA4NzUxMDEzN30.L6KQdh4NJbKszr8SUocc9F14tZWizelFT_fIs-BxAPw';
const supabaseSignUp = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'sb-signup-temp',
  },
});

export const getAllStaff = async (): Promise<{
  data: Staff[] | null;
  error: string | null;
}> => {
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

export const getStaffById = async (
  id: string,
): Promise<{ data: Staff | null; error: string | null }> => {
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

export const getStaffByDepartment = async (
  department: string,
): Promise<{ data: Staff[] | null; error: string | null }> => {
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

export const getStaffByStatus = async (
  status: string,
): Promise<{ data: Staff[] | null; error: string | null }> => {
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

export const createStaff = async (
  staffData: StaffFormData,
): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    const { data: authData, error: authError } =
      await supabaseSignUp.auth.signUp({
        email: staffData.email,
        password: 'clinika123',
      });

    if (authError) {
      return {
        data: null,
        error: `Failed to create user account: ${authError.message}`,
      };
    }

    if (!authData.user) {
      return { data: null, error: 'Failed to create user account' };
    }

    const insertData: StaffInsert = {
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      specialization: staffData.specialization || null,
      department: staffData.department || null, // ← added
      status: staffData.status,
      phone: staffData.phone || null,
      user_id: authData.user.id,
      user_role: 'staff',
      duty_status: 'Off Duty',
    };

    const { data, error } = await supabase
      .from('staff')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(
        'Staff record creation failed after auth user was created:',
        error,
      );
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const updateStaff = async (
  id: string,
  staffData: StaffFormData,
): Promise<{ data: Staff | null; error: string | null }> => {
  try {
    const updateData: StaffUpdate = {
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      specialization: staffData.specialization || null,
      department: staffData.department || null, // ← added
      status: staffData.status,
      phone: staffData.phone || null,
      updated_at: new Date().toISOString(),
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

export const deleteStaff = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { data: staffRecord, error: fetchError } = await supabase
      .from('staff')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    if (staffRecord?.user_id) {
      const { error: authDeleteError } = await supabase.rpc(
        'delete_auth_user',
        {
          target_user_id: staffRecord.user_id,
        },
      );
      if (authDeleteError) {
        console.error(
          'Auth user deletion failed (staff record was already deleted):',
          authDeleteError,
        );
      }
    }

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

export const searchStaff = async (
  query: string,
): Promise<{ data: Staff[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .or(
        `name.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`,
      )
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

export const updateDutyStatus = async (
  id: string,
  dutyStatus: string,
): Promise<{ data: Staff | null; error: string | null }> => {
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

export const getStaffCountByStatus = async (): Promise<{
  data: {
    total: number;
    onDuty: number;
    offDuty: number;
    onLeave: number;
  } | null;
  error: string | null;
}> => {
  try {
    const { data: allStaff, error } = await supabase
      .from('staff')
      .select('status');

    if (error) throw error;

    const counts = {
      total: allStaff?.length || 0,
      onDuty:
        allStaff?.filter((s: { status: string }) => s.status === 'On Duty')
          .length || 0,
      offDuty:
        allStaff?.filter((s: { status: string }) => s.status === 'Off Duty')
          .length || 0,
      onLeave:
        allStaff?.filter((s: { status: string }) => s.status === 'On Leave')
          .length || 0,
    };

    return { data: counts, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};
