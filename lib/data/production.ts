import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDelayRisk,
  kanbanStages,
  type DelayRisk,
} from "@/lib/production/stage-rules";
import type { ProductionStage } from "@/lib/constants/workflow";
import type { AuthSessionContext } from "@/types/app";

export type ProductionCaseCard = {
  id: string;
  caseNumber: string;
  doctorName: string;
  patientName: string;
  workType: string;
  material: string | null;
  unitsCount: number;
  dueDate: string | null;
  isUrgent: boolean;
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  currentStage: ProductionStage;
  missingInfoStatus: string;
  priorityScore: number;
  delayRisk: DelayRisk;
  hasPassedQc: boolean;
};

export type ProductionTechnician = {
  id: string;
  profileId: string | null;
  name: string;
  workload: number;
  skills: string[];
};

export type ProductionBoardData = {
  columns: Array<{
    stage: ProductionStage;
    cases: ProductionCaseCard[];
  }>;
  technicians: ProductionTechnician[];
};

export type TechnicianWorkspaceData = {
  technician: ProductionTechnician | null;
  assignedCases: ProductionCaseCard[];
  dueToday: number;
  overdue: number;
  needsDesignUpload: number;
  needsQcCorrection: number;
  productivity: {
    assignedCases: number;
    completedCases: number;
    unitsCompleted: number;
    averageStageTimeHours: number;
    delayPercentage: number;
    qcPassRate: number | null;
  };
};

type ProductionCaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  material: string | null;
  units_count: number | null;
  due_date: string | null;
  is_urgent: boolean | null;
  assigned_technician_id: string | null;
  current_stage: ProductionStage | null;
  stage: ProductionStage;
  missing_info_status: string | null;
  priority_score: number | null;
  status: string | null;
  doctors: { display_name: string } | null;
};

type TechnicianRow = {
  id: string;
  profile_id: string | null;
  display_name: string;
};

type SkillRow = {
  technician_id: string;
  skill: string;
};

type QcRow = {
  case_id: string;
  result: string;
};

type StageLogRow = {
  case_id: string;
  started_at: string | null;
  completed_at: string | null;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

function average(numbers: number[]) {
  if (!numbers.length) return 0;

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function toCard(params: {
  row: ProductionCaseRow;
  technicianNames: Map<string, string>;
  passedQcCaseIds: Set<string>;
}) {
  const currentStage = params.row.current_stage ?? params.row.stage;
  const missingInfoStatus = params.row.missing_info_status ?? "complete";

  return {
    id: params.row.id,
    caseNumber: params.row.case_number,
    doctorName: params.row.doctors?.display_name ?? "Unknown doctor",
    patientName: params.row.patient_name ?? params.row.patient_display,
    workType: params.row.work_type ?? params.row.restoration_type,
    material: params.row.material,
    unitsCount: Number(params.row.units_count ?? 1),
    dueDate: params.row.due_date,
    isUrgent: Boolean(params.row.is_urgent),
    assignedTechnicianId: params.row.assigned_technician_id,
    assignedTechnicianName: params.row.assigned_technician_id
      ? params.technicianNames.get(params.row.assigned_technician_id) ?? null
      : null,
    currentStage,
    missingInfoStatus,
    priorityScore: Number(params.row.priority_score ?? 0),
    delayRisk: getDelayRisk({
      dueDate: params.row.due_date,
      currentStage,
      missingInfoStatus,
    }),
    hasPassedQc: params.passedQcCaseIds.has(params.row.id),
  } satisfies ProductionCaseCard;
}

async function getTechnicians(labId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: technicians, error }, { data: skills, error: skillsError }] =
    await Promise.all([
      supabase
        .from("technicians")
        .select("id, profile_id, display_name")
        .eq("lab_id", labId)
        .eq("employment_status", "active")
        .order("display_name")
        .returns<TechnicianRow[]>(),
      supabase
        .from("technician_skills")
        .select("technician_id, skill")
        .eq("lab_id", labId)
        .returns<SkillRow[]>(),
    ]);

  if (error ?? skillsError) throw new Error((error ?? skillsError)?.message);

  const skillMap = new Map<string, string[]>();

  for (const skill of skills ?? []) {
    skillMap.set(skill.technician_id, [
      ...(skillMap.get(skill.technician_id) ?? []),
      skill.skill.toLowerCase(),
    ]);
  }

  return (technicians ?? []).map((technician) => ({
    id: technician.id,
    profileId: technician.profile_id,
    name: technician.display_name,
    workload: 0,
    skills: skillMap.get(technician.id) ?? [],
  }));
}

export async function getProductionBoardData(
  session: AuthSessionContext,
): Promise<ProductionBoardData> {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const technicians = await getTechnicians(labId);
  const technicianNames = new Map(
    technicians
      .filter((technician) => technician.profileId)
      .map((technician) => [technician.profileId as string, technician.name]),
  );

  const [{ data: cases, error }, { data: qcRows, error: qcError }] =
    await Promise.all([
      supabase
        .from("cases")
        .select(
          "id, case_number, patient_name, patient_display, work_type, restoration_type, material, units_count, due_date, is_urgent, assigned_technician_id, current_stage, stage, missing_info_status, priority_score, status, doctors(display_name)",
        )
        .eq("lab_id", labId)
        .in("current_stage", kanbanStages)
        .not("status", "in", "(completed,cancelled,archived)")
        .order("priority_score", { ascending: false })
        .order("due_date", { ascending: true })
        .returns<ProductionCaseRow[]>(),
      supabase
        .from("quality_checks")
        .select("case_id, result")
        .eq("lab_id", labId)
        .eq("result", "passed")
        .returns<QcRow[]>(),
    ]);

  if (error ?? qcError) throw new Error((error ?? qcError)?.message);

  const passedQcCaseIds = new Set((qcRows ?? []).map((row) => row.case_id));
  const cards = (cases ?? []).map((row) =>
    toCard({ row, technicianNames, passedQcCaseIds }),
  );
  const workloadByProfile = new Map<string, number>();

  for (const card of cards) {
    if (!card.assignedTechnicianId) continue;
    workloadByProfile.set(
      card.assignedTechnicianId,
      (workloadByProfile.get(card.assignedTechnicianId) ?? 0) + 1,
    );
  }

  return {
    columns: kanbanStages.map((stage) => ({
      stage,
      cases: cards.filter((card) => card.currentStage === stage),
    })),
    technicians: technicians.map((technician) => ({
      ...technician,
      workload: technician.profileId
        ? workloadByProfile.get(technician.profileId) ?? 0
        : 0,
    })),
  };
}

export async function getTechnicianWorkspaceData(
  session: AuthSessionContext,
): Promise<TechnicianWorkspaceData> {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const technicians = await getTechnicians(labId);
  const technician =
    technicians.find((item) => item.profileId === session.userId) ?? null;
  const technicianNames = new Map([[session.userId, technician?.name ?? "Me"]]);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: cases, error },
    { data: qcRows, error: qcError },
    { data: logs, error: logsError },
    { data: completedCases, error: completedError },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, case_number, patient_name, patient_display, work_type, restoration_type, material, units_count, due_date, is_urgent, assigned_technician_id, current_stage, stage, missing_info_status, priority_score, status, doctors(display_name)",
      )
      .eq("lab_id", labId)
      .eq("assigned_technician_id", session.userId)
      .in("current_stage", kanbanStages)
      .order("priority_score", { ascending: false })
      .order("due_date", { ascending: true })
      .returns<ProductionCaseRow[]>(),
    supabase
      .from("quality_checks")
      .select("case_id, result")
      .eq("lab_id", labId)
      .returns<QcRow[]>(),
    supabase
      .from("case_stage_logs")
      .select("case_id, started_at, completed_at")
      .eq("lab_id", labId)
      .not("started_at", "is", null)
      .not("completed_at", "is", null)
      .returns<StageLogRow[]>(),
    supabase
      .from("cases")
      .select("id, units_count, due_date, updated_at")
      .eq("lab_id", labId)
      .eq("assigned_technician_id", session.userId)
      .in("current_stage", ["delivered", "completed"])
      .returns<
        Array<{
          id: string;
          units_count: number | null;
          due_date: string | null;
          updated_at: string;
        }>
      >(),
  ]);

  if (error ?? qcError ?? logsError ?? completedError) {
    throw new Error((error ?? qcError ?? logsError ?? completedError)?.message);
  }

  const passedQcCaseIds = new Set(
    (qcRows ?? [])
      .filter((row) => row.result === "passed")
      .map((row) => row.case_id),
  );
  const assignedCases = (cases ?? []).map((row) =>
    toCard({ row, technicianNames, passedQcCaseIds }),
  );
  const stageDurations = (logs ?? [])
    .map((log) => {
      if (!log.started_at || !log.completed_at) return 0;
      return (
        (new Date(log.completed_at).getTime() -
          new Date(log.started_at).getTime()) /
        3_600_000
      );
    })
    .filter((duration) => duration > 0);
  const completed = completedCases ?? [];
  const delayedCompleted = completed.filter(
    (item) => item.due_date && item.updated_at.slice(0, 10) > item.due_date,
  ).length;
  const qcForAssigned = (qcRows ?? []).filter((row) =>
    assignedCases.some((item) => item.id === row.case_id),
  );
  const qcPassed = qcForAssigned.filter((row) => row.result === "passed").length;

  return {
    technician,
    assignedCases,
    dueToday: assignedCases.filter((item) => item.dueDate === today).length,
    overdue: assignedCases.filter((item) => item.delayRisk === "overdue").length,
    needsDesignUpload: assignedCases.filter(
      (item) => item.currentStage === "cad_design",
    ).length,
    needsQcCorrection: assignedCases.filter(
      (item) =>
        item.currentStage === "quality_control" && !item.hasPassedQc,
    ).length,
    productivity: {
      assignedCases: assignedCases.length,
      completedCases: completed.length,
      unitsCompleted: completed.reduce(
        (sum, item) => sum + Number(item.units_count ?? 0),
        0,
      ),
      averageStageTimeHours: Math.round(average(stageDurations) * 10) / 10,
      delayPercentage: completed.length
        ? Math.round((delayedCompleted / completed.length) * 100)
        : 0,
      qcPassRate: qcForAssigned.length
        ? Math.round((qcPassed / qcForAssigned.length) * 100)
        : null,
    },
  };
}
