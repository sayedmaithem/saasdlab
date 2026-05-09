import type { AppRole } from "@/lib/constants/roles";
import type {
  IntakeFileType,
  ProductionStage,
} from "@/lib/constants/workflow";
import type { CasePriority } from "@/types/app";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      labs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["labs"]["Insert"]>;
        Relationships: [];
      };
      lab_memberships: {
        Row: {
          id: string;
          lab_id: string;
          user_id: string;
          role: AppRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          user_id: string;
          role: AppRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["lab_memberships"]["Insert"]
        >;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          lab_id: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: AppRole | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          lab_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: AppRole | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          lab_id: string;
          user_id: string;
          role: AppRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          user_id: string;
          role: AppRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
      clinics: {
        Row: {
          id: string;
          lab_id: string;
          name: string;
          address: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          name: string;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>;
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          lab_id: string;
          profile_id: string | null;
          display_name: string;
          email: string | null;
          phone: string | null;
          default_clinic_id: string | null;
          performance_score: number;
          is_active: boolean;
          is_vip: boolean;
          address: string | null;
          notes: string | null;
          payment_terms: string | null;
          default_price_group: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          profile_id?: string | null;
          display_name: string;
          email?: string | null;
          phone?: string | null;
          default_clinic_id?: string | null;
          performance_score?: number;
          is_active?: boolean;
          is_vip?: boolean;
          address?: string | null;
          notes?: string | null;
          payment_terms?: string | null;
          default_price_group?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctors"]["Insert"]>;
        Relationships: [];
      };
	      cases: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_number: string;
	          patient_display: string;
	          patient_name: string | null;
	          doctor_id: string;
          clinic_id: string;
          stage: ProductionStage;
          current_stage?: ProductionStage;
          status?: string;
          priority: CasePriority;
          restoration_type: string;
          work_type?: string | null;
          material?: string | null;
          shade: string | null;
          tooth_numbers: number[];
          units_count?: number;
          due_date: string | null;
          is_urgent?: boolean;
          is_remake?: boolean;
          is_warranty?: boolean;
          requires_doctor_approval?: boolean;
          missing_info_status?: string;
          missing_info_fields?: Json;
          priority_score?: number;
          total_price?: number;
          physical_impression_received?: boolean;
          preparation_photo_received?: boolean;
          implant_system?: string | null;
          scan_body_info?: string | null;
          bite_info?: string | null;
          arch?: string | null;
	          complexity?: string;
	          clinical_notes: string | null;
	          notes: string | null;
	          assigned_technician_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
	          case_number: string;
	          patient_display: string;
	          patient_name?: string | null;
	          doctor_id: string;
          clinic_id: string;
          stage?: ProductionStage;
          current_stage?: ProductionStage;
          status?: string;
          priority?: CasePriority;
          restoration_type: string;
          work_type?: string | null;
          material?: string | null;
          shade?: string | null;
          tooth_numbers?: number[];
          units_count?: number;
          due_date?: string | null;
          is_urgent?: boolean;
          is_remake?: boolean;
          is_warranty?: boolean;
          requires_doctor_approval?: boolean;
          missing_info_status?: string;
          missing_info_fields?: Json;
          priority_score?: number;
          total_price?: number;
          physical_impression_received?: boolean;
          preparation_photo_received?: boolean;
          implant_system?: string | null;
          scan_body_info?: string | null;
          bite_info?: string | null;
          arch?: string | null;
	          complexity?: string;
	          clinical_notes?: string | null;
	          notes?: string | null;
	          assigned_technician_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
        Relationships: [];
      };
      case_stage_logs: {
        Row: {
          id: string;
          lab_id: string;
          case_id: string;
	          from_stage: ProductionStage | null;
	          to_stage: ProductionStage;
	          changed_by: string | null;
	          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          case_id: string;
	          from_stage?: ProductionStage | null;
	          to_stage: ProductionStage;
	          changed_by?: string | null;
	          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["case_stage_logs"]["Insert"]
        >;
        Relationships: [];
      };
      case_timeline: {
        Row: {
          id: string;
          lab_id: string;
	          case_id: string;
	          actor_id: string | null;
	          event_type: string;
          title: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
	          case_id: string;
	          actor_id?: string | null;
	          event_type: string;
          title: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["case_timeline"]["Insert"]
        >;
        Relationships: [];
      };
      doctor_price_lists: {
        Row: {
          id: string;
          lab_id: string;
          doctor_id: string | null;
          clinic_id: string | null;
          work_type: string;
          material: string | null;
          unit_price: number;
          is_active: boolean;
          effective_from: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          work_type: string;
          material?: string | null;
          unit_price: number;
          is_active?: boolean;
          effective_from?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["doctor_price_lists"]["Insert"]
        >;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          lab_id: string;
          doctor_id: string;
          clinic_id: string | null;
          invoice_number: string;
          status: string;
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          paid_amount: number;
          remaining_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          doctor_id: string;
          clinic_id?: string | null;
          invoice_number: string;
          status?: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          paid_amount?: number;
          remaining_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          lab_id: string;
          invoice_id: string | null;
          doctor_id: string | null;
          amount: number;
          paid_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          invoice_id?: string | null;
          doctor_id?: string | null;
          amount: number;
          paid_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      case_files: {
        Row: {
          id: string;
          lab_id: string;
          case_id: string;
          design_version_id: string | null;
          bucket: string;
          storage_path: string;
          file_kind: IntakeFileType;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          case_id: string;
          design_version_id?: string | null;
          bucket?: string;
          storage_path: string;
          file_kind: IntakeFileType;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["case_files"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      case_stage: ProductionStage;
      case_priority: CasePriority;
      file_kind: IntakeFileType;
    };
  };
};
