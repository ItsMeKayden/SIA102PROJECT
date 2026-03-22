export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string;
          appointment_time: string;
          created_at: string;
          doctor_id: string | null;
          department?: string | null;
          id: string;
          notes: string | null;
          prescription?: string | null;
          patient_contact: string;
          patient_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          appointment_date: string;
          appointment_time: string;
          created_at?: string;
          doctor_id?: string | null;
          department?: string | null;
          id?: string;
          notes?: string | null;
          patient_contact: string;
          patient_name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          appointment_date?: string;
          appointment_time?: string;
          created_at?: string;
          doctor_id?: string | null;
          department?: string | null;
          id?: string;
          notes?: string | null;
          patient_contact?: string;
          patient_name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          staff_id: string;
          status: string;
          time_in: string | null;
          time_out: string | null;
          clock_in_latitude: number | null;
          clock_in_longitude: number | null;
          clock_in_within_premises: boolean | null;
          clock_out_latitude: number | null;
          clock_out_longitude: number | null;
          clock_out_within_premises: boolean | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notes?: string | null;
          staff_id: string;
          status?: string;
          time_in?: string | null;
          time_out?: string | null;
          clock_in_latitude?: number | null;
          clock_in_longitude?: number | null;
          clock_in_within_premises?: boolean | null;
          clock_out_latitude?: number | null;
          clock_out_longitude?: number | null;
          clock_out_within_premises?: boolean | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          staff_id?: string;
          status?: string;
          time_in?: string | null;
          time_out?: string | null;
          clock_in_latitude?: number | null;
          clock_in_longitude?: number | null;
          clock_in_within_premises?: boolean | null;
          clock_out_latitude?: number | null;
          clock_out_longitude?: number | null;
          clock_out_within_premises?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };

      services: {
        Row: {
          serviceID: string;
          serviceName: string;
          duration: string;
          price: number;
          downpayment: number;
          status: "Available" | "Unavailable";
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          serviceID?: string;
          serviceName: string;
          duration: string;
          price: number;
          downpayment: number;
          status?: "Available" | "Unavailable";
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          serviceID?: string;
          serviceName?: string;
          duration?: string;
          price?: number;
          downpayment?: number;
          status?: "Available" | "Unavailable";
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          staff_id: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          staff_id?: string | null;
          title: string;
          type?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          staff_id?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean;
          notes: string | null;
          shift_session: string;
          staff_id: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          shift_session?: string;
          staff_id: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          shift_session?: string;
          staff_id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_swap_requests: {
        Row: {
          approved_at: string | null;
          approved_by_staff_id: string | null;
          created_at: string;
          decision_notes: string | null;
          from_schedule_id: string;
          id: string;
          reason: string | null;
          rejected_at: string | null;
          requested_by_staff_id: string;
          status: string;
          to_schedule_id: string;
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by_staff_id?: string | null;
          created_at?: string;
          decision_notes?: string | null;
          from_schedule_id: string;
          id?: string;
          reason?: string | null;
          rejected_at?: string | null;
          requested_by_staff_id: string;
          status?: string;
          to_schedule_id: string;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by_staff_id?: string | null;
          created_at?: string;
          decision_notes?: string | null;
          from_schedule_id?: string;
          id?: string;
          reason?: string | null;
          rejected_at?: string | null;
          requested_by_staff_id?: string;
          status?: string;
          to_schedule_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedule_swap_requests_approved_by_staff_id_fkey';
            columns: ['approved_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedule_swap_requests_from_schedule_id_fkey';
            columns: ['from_schedule_id'];
            isOneToOne: false;
            referencedRelation: 'schedules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedule_swap_requests_requested_by_staff_id_fkey';
            columns: ['requested_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedule_swap_requests_to_schedule_id_fkey';
            columns: ['to_schedule_id'];
            isOneToOne: false;
            referencedRelation: 'schedules';
            referencedColumns: ['id'];
          },
        ];
      };
      staff: {
        Row: {
          created_at: string;
          duty_status: string | null;
          email: string;
          id: string;
          staffid: string;
          avatar_url?: string | null;
          lastName: string;
          firstName: string;
          middleName: string;
          name: string;
          phone: string | null;
          role: string;
          specialization: string | null;
          department?: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
          user_role: string | null;
        };
        Insert: {
          created_at?: string;
          duty_status?: string | null;
          email: string;
          id?: string;
          name: string;
          phone?: string | null;
          role: string;
          specialization?: string | null;
          department?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          user_role?: string | null;
        };
        Update: {
          created_at?: string;
          duty_status?: string | null;
          email?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          role?: string;
          specialization?: string | null;
          department?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          user_role?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_auth_user: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
