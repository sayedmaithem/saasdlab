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
          full_name: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      clinics: {
        Row: {
          id: string;
          lab_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
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
          doctor_id: string;
          clinic_id: string;
          stage: ProductionStage;
          priority: CasePriority;
          restoration_type: string;
          shade: string | null;
          tooth_numbers: number[];
          due_date: string | null;
          clinical_notes: string | null;
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
          doctor_id: string;
          clinic_id: string;
          stage?: ProductionStage;
          priority?: CasePriority;
          restoration_type: string;
          shade?: string | null;
          tooth_numbers?: number[];
          due_date?: string | null;
          clinical_notes?: string | null;
          assigned_technician_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
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
