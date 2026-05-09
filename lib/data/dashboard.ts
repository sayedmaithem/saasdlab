import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  productionStages,
  stageLabels,
  type ProductionStage,
} from "@/lib/constants/workflow";
import type {
  CasePriority,
  CaseSummary,
  DashboardData,
  DoctorPerformance,
  SelectOption,
  StageMetric,
} from "@/lib/types";

type CaseRow = {
  id: string;
  case_number: string;
  patient_display: string;
  stage: ProductionStage;
  priority: CasePriority;
  due_date: string | null;
  restoration_type: string;
  doctors: { display_name: string } | null;
  clinics: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

const previewCases: CaseSummary[] = [
  {
    id: "preview-001",
    caseNumber: "LF-260509-001",
    patientDisplay: "H. Alwan",
    doctorName: "Dr. Zain Kareem",
    clinicName: "Pearl Dental Center",
    stage: "cad_design",
    priority: "urgent",
    dueDate: "2026-05-12",
    restorationType: "Zirconia crown",
    assignedTechnician: "Mina",
    fileCount: 4,
    unreadDiscussionCount: 2,
  },
  {
    id: "preview-002",
    caseNumber: "LF-260509-002",
    patientDisplay: "S. Mahdi",
    doctorName: "Dr. Noor Abbas",
    clinicName: "Noor Smile Clinic",
    stage: "doctor_approval",
    priority: "normal",
    dueDate: "2026-05-14",
    restorationType: "Implant bridge",
    assignedTechnician: "Ali",
    fileCount: 8,
    unreadDiscussionCount: 1,
  },
  {
    id: "preview-003",
    caseNumber: "LF-260509-003",
    patientDisplay: "R. Hassan",
    doctorName: "Dr. Omar Saleh",
    clinicName: "Baghdad Prostho Lab",
    stage: "quality_control",
    priority: "normal",
    dueDate: "2026-05-10",
    restorationType: "E-max veneer set",
    assignedTechnician: "Sara",
    fileCount: 6,
    unreadDiscussionCount: 0,
  },
  {
    id: "preview-004",
    caseNumber: "LF-260509-004",
    patientDisplay: "A. Latif",
    doctorName: "Dr. Zain Kareem",
    clinicName: "Pearl Dental Center",
    stage: "ready_for_delivery",
    priority: "low",
    dueDate: "2026-05-11",
    restorationType: "Night guard",
    assignedTechnician: "Hussein",
    fileCount: 2,
    unreadDiscussionCount: 0,
  },
];

const previewDoctors: DoctorPerformance[] = [
  {
    doctorName: "Dr. Zain Kareem",
    activeCases: 18,
    approvalRate: 94,
    remakeRate: 3.2,
    paymentStatus: "good",
  },
  {
    doctorName: "Dr. Noor Abbas",
    activeCases: 11,
    approvalRate: 88,
    remakeRate: 4.8,
    paymentStatus: "attention",
  },
  {
    doctorName: "Dr. Omar Saleh",
    activeCases: 7,
    approvalRate: 96,
    remakeRate: 1.4,
    paymentStatus: "good",
  },
];

function buildStageMetrics(cases: CaseSummary[]): StageMetric[] {
  return productionStages
    .map((stage) => {
      const stageCases = cases.filter((item) => item.stage === stage);
      const today = new Date().toISOString().slice(0, 10);

      return {
        stage,
        count: stageCases.length,
        overdue: stageCases.filter(
          (item) => item.dueDate && item.dueDate < today,
        ).length,
      };
    })
    .filter((item) => item.count > 0 || item.overdue > 0);
}

function buildKpis(cases: CaseSummary[], pendingApprovals: number) {
  const dueSoon = cases.filter((item) => item.dueDate).length;
  const urgent = cases.filter((item) => item.priority === "urgent").length;
  const completed = cases.filter((item) => item.stage === "completed").length;

  return [
    {
      label: "Active cases",
      value: String(cases.length),
      hint: `${urgent} urgent, ${dueSoon} with due dates`,
    },
    {
      label: "Doctor approvals",
      value: String(pendingApprovals),
      hint: "Designs waiting on doctor response",
    },
    {
      label: "Completed",
      value: String(completed),
      hint: "Cases closed in current view",
    },
    {
      label: "Production stages",
      value: String(buildStageMetrics(cases).length),
      hint: "Active workflow lanes with work",
    },
  ];
}

function toCaseSummary(row: CaseRow): CaseSummary {
  return {
    id: row.id,
    caseNumber: row.case_number,
    patientDisplay: row.patient_display,
    doctorName: row.doctors?.display_name ?? "Unassigned doctor",
    clinicName: row.clinics?.name ?? "Unassigned clinic",
    stage: row.stage,
    priority: row.priority,
    dueDate: row.due_date,
    restorationType: row.restoration_type,
    assignedTechnician: row.profiles?.full_name ?? null,
    fileCount: 0,
    unreadDiscussionCount: 0,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseEnv()) {
    const pendingApprovals = previewCases.filter(
      (item) => item.stage === "doctor_approval",
    ).length;

    return {
      source: "preview",
      labName: "LabFlow Preview Lab",
      kpis: buildKpis(previewCases, pendingApprovals),
      stageMetrics: buildStageMetrics(previewCases),
      activeCases: previewCases,
      doctorPerformance: previewDoctors,
      pendingApprovals,
      openQcIssues: 2,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      source: "supabase",
      labName: "LabFlow",
      kpis: buildKpis([], 0),
      stageMetrics: [],
      activeCases: [],
      doctorPerformance: [],
      pendingApprovals: 0,
      openQcIssues: 0,
    };
  }

  const { data: cases, error } = await supabase
    .from("cases")
    .select(
      "id, case_number, patient_display, stage, priority, due_date, restoration_type, doctors(display_name), clinics(name), profiles(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(40)
    .returns<CaseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const activeCases = (cases ?? []).map(toCaseSummary);
  const pendingApprovals = activeCases.filter(
    (item) => item.stage === "doctor_approval",
  ).length;

  return {
    source: "supabase",
    labName: "LabFlow",
    kpis: buildKpis(activeCases, pendingApprovals),
    stageMetrics: buildStageMetrics(activeCases),
    activeCases,
    doctorPerformance: [],
    pendingApprovals,
    openQcIssues: 0,
  };
}

export async function getCaseFormOptions(): Promise<{
  source: "supabase" | "preview";
  doctors: SelectOption[];
  clinics: SelectOption[];
}> {
  if (!hasSupabaseEnv()) {
    return {
      source: "preview",
      doctors: [
        { label: "Dr. Zain Kareem", value: "00000000-0000-4000-8000-000000000001" },
        { label: "Dr. Noor Abbas", value: "00000000-0000-4000-8000-000000000002" },
      ],
      clinics: [
        { label: "Pearl Dental Center", value: "00000000-0000-4000-8000-000000000101" },
        { label: "Noor Smile Clinic", value: "00000000-0000-4000-8000-000000000102" },
      ],
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: doctors, error: doctorsError }, { data: clinics, error: clinicsError }] =
    await Promise.all([
      supabase
        .from("doctors")
        .select("id, display_name")
        .order("display_name")
        .returns<Array<{ id: string; display_name: string }>>(),
      supabase
        .from("clinics")
        .select("id, name")
        .order("name")
        .returns<Array<{ id: string; name: string }>>(),
    ]);

  if (doctorsError) {
    throw new Error(doctorsError.message);
  }

  if (clinicsError) {
    throw new Error(clinicsError.message);
  }

  return {
    source: "supabase",
    doctors: (doctors ?? []).map((doctor) => ({
      label: doctor.display_name,
      value: doctor.id,
    })),
    clinics: (clinics ?? []).map((clinic) => ({
      label: clinic.name,
      value: clinic.id,
    })),
  };
}

export function getStageLabel(stage: ProductionStage) {
  return stageLabels[stage];
}
