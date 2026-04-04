import { supabase } from "../../lib/supabase-client";

export interface Service {
  id: string;
  name: string;
  department: string | null;
  specialization: string | null;
  duration: string;
  price: number;
  downpayment: number;
  status: "Available" | "Unavailable";
  service_type?: "Consultation" | "Laboratory" | "Procedure";
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ServiceFormData = Omit<Service, "id" | "created_at" | "updated_at">;

export interface Department {
  id: string;
  name: string;
  created_at?: string;
}

export interface SpecializationRecord {
  id: string;
  name: string;
  department_id: string;
  department: string;
  created_at?: string;
}

export interface SpecializationFormData {
  name: string;
  department_id: string;
  department_name: string;
}

// Get all services
export const getAllServices = async (): Promise<{
  data: Service[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as Service[], error: null };
  } catch (err) {
    console.error("Error:", err);
    return { data: [], error: "Failed to fetch services" };
  }
};

// Create a new service
export const createService = async (
  data: ServiceFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from("services").insert([
      {
        ...data,
        department: data.department || null,
        specialization: data.specialization || null,
      },
    ]);

    if (error) {
      console.error("Error creating service:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to create service" };
  }
};

// Update a service
export const updateService = async (
  id: string,
  data: ServiceFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("services")
      .update({
        ...data,
        department: data.department || null,
        specialization: data.specialization || null,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating service:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to update service" };
  }
};

// Delete a service
export const deleteService = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.error("Error deleting service:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to delete service" };
  }
};

// Get all unique departments from the staff table
export const getAllDepartmentsWithIds = async (): Promise<{
  data: Department[] | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("departmentID, departmentName, created_at")
      .order("departmentName", { ascending: true });

    if (error) {
      console.error("Error fetching departments:", error);
      return { data: null, error: error.message };
    }

    const mapped: Department[] = (data || []).map((d) => ({
      id: d.departmentID,
      name: d.departmentName,
      created_at: d.created_at,
    }));

    return { data: mapped, error: null };
  } catch (err) {
    console.error("Error:", err);
    return { data: null, error: "Failed to fetch departments" };
  }
};

export const getAllDepartments = async (): Promise<{
  data: string[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("departmentName")
      .order("departmentName", { ascending: true });

    if (error) {
      console.error("Error fetching departments:", error);
      return { data: [], error: error.message };
    }

    return { data: (data || []).map((d) => d.departmentName), error: null };
  } catch (err) {
    console.error("Error:", err);
    return { data: [], error: "Failed to fetch departments" };
  }
};

export const createDepartment = async (
  name: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("departments")
      .insert({ departmentName: name });

    if (error) {
      console.error("Error creating department:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to create department" };
  }
};

export const updateDepartment = async (
  id: string,
  name: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("departments")
      .update({ departmentName: name })
      .eq("departmentID", id);

    if (error) {
      console.error("Error updating department:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to update department" };
  }
};

export const deleteDepartment = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("departmentID", id);

    if (error) {
      console.error("Error deleting department:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to delete department" };
  }
};

export const getAllSpecializationsWithIds = async (): Promise<{
  data: SpecializationRecord[] | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from("specializations")
      .select(
        "specializationID, specializationName, departmentID, departmentName, created_at",
      )
      .order("specializationName", { ascending: true });

    if (error) {
      console.error("Error fetching specializations:", error);
      return { data: null, error: error.message };
    }

    const mapped: SpecializationRecord[] = (data || []).map((s) => ({
      id: s.specializationID,
      name: s.specializationName,
      department_id: s.departmentID,
      department: s.departmentName ?? "",
      created_at: s.created_at,
    }));

    return { data: mapped, error: null };
  } catch (err) {
    console.error("Error:", err);
    return { data: null, error: "Failed to fetch specializations" };
  }
};

// Get all unique specializations from the staff table, optionally filtered by department
export const getSpecializations = async (
  departmentName?: string,
): Promise<{ data: string[]; error: string | null }> => {
  try {
    let specQuery = supabase
      .from("specializations")
      .select("specializationName, departmentID")
      .order("specializationName", { ascending: true });

    if (departmentName) {
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("departmentID")
        .eq("departmentName", departmentName)
        .single();

      if (deptError || !deptData) {
        return { data: [], error: null };
      }

      specQuery = specQuery.eq("departmentID", deptData.departmentID);
    }

    const { data, error } = await specQuery;

    if (error) {
      console.error("Error fetching specializations:", error);
      return { data: [], error: error.message };
    }

    const unique = [
      ...new Set((data || []).map((s) => s.specializationName).filter(Boolean)),
    ] as string[];

    return { data: unique, error: null };
  } catch (err) {
    console.error("Error:", err);
    return { data: [], error: "Failed to fetch specializations" };
  }
};

export const createSpecialization = async (
  formData: SpecializationFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from("specializations").insert({
      specializationName: formData.name,
      departmentID: formData.department_id,
      departmentName: formData.department_name,
    });

    if (error) {
      console.error("Error creating specialization:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to create specialization" };
  }
};

export const updateSpecialization = async (
  id: string,
  formData: SpecializationFormData,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("specializations")
      .update({
        specializationName: formData.name,
        departmentID: formData.department_id,
        departmentName: formData.department_name,
      })
      .eq("specializationID", id);

    if (error) {
      console.error("Error updating specialization:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to update specialization" };
  }
};

export const deleteSpecialization = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("specializations")
      .delete()
      .eq("specializationID", id);

    if (error) {
      console.error("Error deleting specialization:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Error:", err);
    return { error: "Failed to delete specialization" };
  }
};
