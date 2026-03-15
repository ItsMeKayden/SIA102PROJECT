import { supabase } from '../../lib/supabase-client';

export interface Service {
  serviceID: string;
  serviceName: string;
  department: string | null;
  specialization: string | null;
  duration: string;
  price: number;
  downpayment: number;
  status: 'Available' | 'Unavailable';
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ServiceFormData = Omit<
  Service,
  'serviceID' | 'created_at' | 'updated_at'
>;

// Get all services
export const getAllServices = async (): Promise<{
  data: Service[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as Service[], error: null };
  } catch (err) {
    console.error('Error:', err);
    return { data: [], error: 'Failed to fetch services' };
  }
};

// Create a new service
export const createService = async (
  data: ServiceFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from('services').insert([
      {
        ...data,
        department: data.department || null,
        specialization: data.specialization || null,
      },
    ]);

    if (error) {
      console.error('Error creating service:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Error:', err);
    return { error: 'Failed to create service' };
  }
};

// Update a service
export const updateService = async (
  id: string,
  data: ServiceFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('services')
      .update({
        ...data,
        department: data.department || null,
        specialization: data.specialization || null,
      })
      .eq('serviceID', id);

    if (error) {
      console.error('Error updating service:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Error:', err);
    return { error: 'Failed to update service' };
  }
};

// Delete a service
export const deleteService = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('serviceID', id);

    if (error) {
      console.error('Error deleting service:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Error:', err);
    return { error: 'Failed to delete service' };
  }
};

// Get all unique departments from the staff table
export const getAllDepartments = async (): Promise<{
  data: string[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('department')
      .not('department', 'is', null);

    if (error) return { data: [], error: error.message };

    const unique = [
      ...new Set((data || []).map((s) => s.department).filter(Boolean)),
    ] as string[];
    unique.sort();
    return { data: unique, error: null };
  } catch {
    return { data: [], error: 'Failed to fetch departments' };
  }
};

// Get all unique specializations from the staff table, optionally filtered by department
export const getSpecializations = async (
  department?: string,
): Promise<{ data: string[]; error: string | null }> => {
  try {
    let query = supabase
      .from('staff')
      .select('specialization')
      .not('specialization', 'is', null);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const unique = [
      ...new Set((data || []).map((s) => s.specialization).filter(Boolean)),
    ] as string[];
    unique.sort();
    return { data: unique, error: null };
  } catch {
    return { data: [], error: 'Failed to fetch specializations' };
  }
};

