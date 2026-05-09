import type { AppRole } from "@/lib/constants/roles";
import type {
  IntakeFileType,
  ProductionStage,
} from "@/lib/constants/workflow";
import type {
  CaseFileCategory,
  CaseFileVisibility,
} from "@/lib/files/case-file-rules";
import type { DesignStatus } from "@/lib/design/design-workflow";
import type { CommentVisibility } from "@/lib/comments/comment-permissions";
import type { QcResult, RemakeResponsibility } from "@/lib/quality/qc-rules";
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
          phone: string | null;
          address: string | null;
          currency: string;
          logo_file_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          phone?: string | null;
          address?: string | null;
          currency?: string;
          logo_file_id?: string | null;
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
		          moved_by: string | null;
		          started_at: string | null;
		          completed_at: string | null;
		          delay_reason: string | null;
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
		          moved_by?: string | null;
		          started_at?: string | null;
		          completed_at?: string | null;
		          delay_reason?: string | null;
		          notes?: string | null;
	          created_at?: string;
	        };
        Update: Partial<
          Database["public"]["Tables"]["case_stage_logs"]["Insert"]
        >;
	        Relationships: [];
	      };
	      technicians: {
	        Row: {
	          id: string;
	          lab_id: string;
	          profile_id: string | null;
	          display_name: string;
	          phone: string | null;
	          employment_status: string;
	          productivity_score: number;
	          created_at: string;
	          updated_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          profile_id?: string | null;
	          display_name: string;
	          phone?: string | null;
	          employment_status?: string;
	          productivity_score?: number;
	          created_at?: string;
	          updated_at?: string;
	        };
	        Update: Partial<Database["public"]["Tables"]["technicians"]["Insert"]>;
	        Relationships: [];
	      };
	      technician_skills: {
	        Row: {
	          id: string;
	          lab_id: string;
	          technician_id: string;
	          skill: string;
	          level: number;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          technician_id: string;
	          skill: string;
	          level?: number;
	          created_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["technician_skills"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      tasks: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          technician_id: string | null;
	          stage: ProductionStage;
	          status: string;
	          title: string;
	          instructions: string | null;
	          started_at: string | null;
	          due_at: string | null;
	          completed_at: string | null;
	          created_by: string | null;
	          created_at: string;
	          updated_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          technician_id?: string | null;
	          stage: ProductionStage;
	          status?: string;
	          title: string;
	          instructions?: string | null;
	          started_at?: string | null;
	          due_at?: string | null;
	          completed_at?: string | null;
	          created_by?: string | null;
	          created_at?: string;
	          updated_at?: string;
	        };
	        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
	        Relationships: [];
	      };
	      quality_checks: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          checked_by: string | null;
	          passed: boolean;
	          result: QcResult;
	          checklist: Json;
	          previous_stage: ProductionStage | null;
	          notes: string | null;
	          completed_at: string | null;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          checked_by?: string | null;
	          passed?: boolean;
	          result?: QcResult;
	          checklist?: Json;
	          previous_stage?: ProductionStage | null;
	          notes?: string | null;
	          completed_at?: string | null;
	          created_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["quality_checks"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      quality_check_items: {
	        Row: {
	          id: string;
	          lab_id: string;
	          quality_check_id: string;
	          label: string;
	          result: QcResult;
	          notes: string | null;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          quality_check_id: string;
	          label: string;
	          result?: QcResult;
	          notes?: string | null;
	          created_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["quality_check_items"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      remakes: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          original_case_id: string | null;
	          reason: string;
	          responsibility: RemakeResponsibility;
	          cost_impact: number;
	          notes: string | null;
	          photo_file_ids: Json;
	          created_by: string | null;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          original_case_id?: string | null;
	          reason: string;
	          responsibility?: RemakeResponsibility;
	          cost_impact?: number;
	          notes?: string | null;
	          photo_file_ids?: Json;
	          created_by?: string | null;
	          created_at?: string;
	        };
	        Update: Partial<Database["public"]["Tables"]["remakes"]["Insert"]>;
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
	      case_comments: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          author_id: string | null;
	          body: string;
	          visibility: CommentVisibility;
	          file_id: string | null;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          author_id?: string | null;
	          body: string;
	          visibility?: CommentVisibility;
	          file_id?: string | null;
	          created_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["case_comments"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      design_versions: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          version_no: number;
	          version_number: number;
	          exocad_project_ref: string | null;
	          notes: string | null;
	          submitted_by: string | null;
	          uploaded_by: string | null;
	          status: DesignStatus;
	          preview_file_id: string | null;
	          doctor_response: string | null;
	          approval_decided_at: string | null;
	          created_at: string;
	          updated_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          version_no: number;
	          version_number: number;
	          exocad_project_ref?: string | null;
	          notes?: string | null;
	          submitted_by?: string | null;
	          uploaded_by?: string | null;
	          status?: DesignStatus;
	          preview_file_id?: string | null;
	          doctor_response?: string | null;
	          approval_decided_at?: string | null;
	          created_at?: string;
	          updated_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["design_versions"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      design_approvals: {
	        Row: {
	          id: string;
	          lab_id: string;
	          case_id: string;
	          design_version_id: string;
	          doctor_id: string;
	          status: string;
	          comment: string | null;
	          requested_at: string;
	          decided_at: string | null;
	          created_at: string;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          case_id: string;
	          design_version_id: string;
	          doctor_id: string;
	          status?: string;
	          comment?: string | null;
	          requested_at?: string;
	          decided_at?: string | null;
	          created_at?: string;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["design_approvals"]["Insert"]
	        >;
	        Relationships: [];
	      };
	      notifications: {
	        Row: {
	          id: string;
	          lab_id: string;
	          recipient_id: string | null;
	          case_id: string | null;
	          title: string;
	          body: string | null;
	          status: string;
	          metadata: Json;
	          created_at: string;
	          read_at: string | null;
	        };
	        Insert: {
	          id?: string;
	          lab_id: string;
	          recipient_id?: string | null;
	          case_id?: string | null;
	          title: string;
	          body?: string | null;
	          status?: string;
	          metadata?: Json;
	          created_at?: string;
	          read_at?: string | null;
	        };
	        Update: Partial<
	          Database["public"]["Tables"]["notifications"]["Insert"]
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
          issue_date: string;
          due_date: string | null;
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          paid_amount: number;
          remaining_balance: number;
          notes: string | null;
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
          issue_date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount?: number;
          tax?: number;
          paid_amount?: number;
          remaining_balance?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          lab_id: string;
          invoice_id: string;
          case_id: string | null;
          case_item_id: string | null;
          description: string;
          work_type: string | null;
          material: string | null;
          quantity: number;
          unit_price: number;
          discount: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          invoice_id: string;
          case_id?: string | null;
          case_item_id?: string | null;
          description: string;
          work_type?: string | null;
          material?: string | null;
          quantity?: number;
          unit_price?: number;
          discount?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          lab_id: string;
          invoice_id: string | null;
          doctor_id: string | null;
          clinic_id: string | null;
          amount: number;
          method: "cash" | "bank_transfer" | "card" | "other" | "wallet" | "adjustment";
          reference: string | null;
          paid_at: string;
          recorded_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          lab_id: string;
          invoice_id?: string | null;
          doctor_id?: string | null;
          clinic_id?: string | null;
          amount: number;
          method?: "cash" | "bank_transfer" | "card" | "other" | "wallet" | "adjustment";
          reference?: string | null;
          paid_at?: string;
          recorded_by?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      payment_allocations: {
        Row: {
          id: string;
          lab_id: string;
          payment_id: string;
          invoice_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          payment_id: string;
          invoice_id: string;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_allocations"]["Insert"]>;
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          lab_id: string;
          case_id: string;
          doctor_id: string | null;
          clinic_id: string | null;
          assigned_to: string | null;
          driver_id: string | null;
          delivery_person_id: string | null;
          status: ProductionStage;
          delivery_status: string;
          address: string | null;
          scheduled_at: string | null;
          out_at: string | null;
          delivered_at: string | null;
          recipient_name: string | null;
          failure_reason: string | null;
          proof_file_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          case_id: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          assigned_to?: string | null;
          driver_id?: string | null;
          delivery_person_id?: string | null;
          status?: ProductionStage;
          delivery_status?: string;
          address?: string | null;
          scheduled_at?: string | null;
          out_at?: string | null;
          delivered_at?: string | null;
          recipient_name?: string | null;
          failure_reason?: string | null;
          proof_file_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deliveries"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          lab_id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          lab_id: string;
          key: string;
          value: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_id: string;
          key: string;
          value?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
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
	          category: CaseFileCategory;
	          file_path: string;
	          file_kind: IntakeFileType;
	          file_type: IntakeFileType;
	          file_name: string;
	          mime_type: string | null;
	          size_bytes: number | null;
	          file_size: number | null;
	          visibility: CaseFileVisibility;
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
	          category?: CaseFileCategory;
	          file_path?: string;
	          file_kind: IntakeFileType;
	          file_type?: IntakeFileType;
	          file_name: string;
	          mime_type?: string | null;
	          size_bytes?: number | null;
	          file_size?: number | null;
	          visibility?: CaseFileVisibility;
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
      qc_result: QcResult;
      remake_responsibility: RemakeResponsibility;
    };
  };
};
