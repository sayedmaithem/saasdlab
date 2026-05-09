import type { AppRole } from "@/lib/constants/roles";
import type { ProductionStage } from "@/lib/constants/workflow";

export type DashboardSource = "supabase" | "preview";

export type CasePriority = "low" | "normal" | "urgent";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "upload"
  | "invoice"
  | "deliver";

export type PermissionResource =
  | "dashboard"
  | "doctor"
  | "clinic"
  | "case"
  | "case_file"
  | "design_version"
  | "production_task"
  | "comment"
  | "quality_check"
  | "invoice"
  | "payment"
  | "delivery"
  | "report"
  | "settings";

export type Permission = `${PermissionResource}:${PermissionAction}`;

export type AuthSessionContext = {
  userId: string;
  email: string | null;
  activeLabId: string | null;
  roles: AppRole[];
};

export type CaseSummary = {
  id: string;
  caseNumber: string;
  patientDisplay: string;
  doctorName: string;
  clinicName: string;
  stage: ProductionStage;
  priority: CasePriority;
  dueDate: string | null;
  restorationType: string;
  assignedTechnician: string | null;
  fileCount: number;
  unreadDiscussionCount: number;
};

export type DashboardKpi = {
  label: string;
  value: string;
  hint: string;
};

export type StageMetric = {
  stage: ProductionStage;
  count: number;
  overdue: number;
};

export type DoctorPerformance = {
  doctorName: string;
  activeCases: number;
  approvalRate: number;
  remakeRate: number;
  paymentStatus: "good" | "attention" | "blocked";
};

export type DashboardData = {
  source: DashboardSource;
  labName: string;
  kpis: DashboardKpi[];
  stageMetrics: StageMetric[];
  activeCases: CaseSummary[];
  doctorPerformance: DoctorPerformance[];
  pendingApprovals: number;
  openQcIssues: number;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type FoundationRoute = {
  title: string;
  eyebrow: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
};
