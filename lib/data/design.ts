import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { CaseFileCategory } from "@/lib/files/case-file-rules";
import type { AuthSessionContext } from "@/types/app";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DesignQueueStage =
  | "cad_design"
  | "doctor_approval"
  | "design_review";

export type DesignQueueItem = {
  id: string;
  caseNumber: string;
  patientName: string;
  doctorName: string;
  clinicName: string | null;
  workType: string;
  dueDate: string | null;
  isUrgent: boolean;
  currentStage: DesignQueueStage;
  /** Number of design versions already uploaded for this case */
  designVersionsCount: number;
  /** Latest design version status (null if none uploaded yet) */
  latestDesignStatus: string | null;
  /** Whether the case has any uploaded scan/source files */
  hasSourceFiles: boolean;
};

export type DesignQueueData = {
  items: DesignQueueItem[];
  totalByStage: Record<DesignQueueStage, number>;
};

// ── Raw DB rows ───────────────────────────────────────────────────────────────

type CaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  restoration_type: string;
  work_type: string | null;
  due_date: string | null;
  is_urgent: boolean | null;
  current_stage: string | null;
  stage: string;
  doctors: { display_name: string } | null;
  clinics: { name: string } | null;
};

type DesignVersionRow = {
  id: string;
  case_id: string;
  status: string;
  version_number: number;
};

type CaseFileRow = {
  id: string;
  case_id: string;
  category: string;
};

// ── Design stages ─────────────────────────────────────────────────────────────

const DESIGN_STAGES: DesignQueueStage[] = [
  "cad_design",
  "doctor_approval",
  "design_review",
];

const SOURCE_FILE_CATEGORIES: CaseFileCategory[] = ["scan_files", "photos", "doctor_uploads"];

function isDesignStage(stage: string | null): stage is DesignQueueStage {
  return DESIGN_STAGES.includes(stage as DesignQueueStage);
}

// ── Data loader ───────────────────────────────────────────────────────────────

export async function getDesignQueueData(
  session: AuthSessionContext,
): Promise<DesignQueueData> {
  const labId = session.activeLabId;

  if (!hasSupabaseEnv() || !labId) {
    return {
      items: [],
      totalByStage: {
        cad_design: 0,
        doctor_approval: 0,
        design_review: 0,
      },
    };
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: cases, error }, { data: designVersions }, { data: caseFiles }] =
    await Promise.all([
      supabase
        .from("cases")
        .select(
          "id, case_number, patient_name, patient_display, restoration_type, work_type, due_date, is_urgent, current_stage, stage, doctors(display_name), clinics(name)",
        )
        .eq("lab_id", labId)
        .in("current_stage", DESIGN_STAGES)
        .not("status", "in", '("completed","cancelled","archived")')
        .order("is_urgent", { ascending: false })
        .order("due_date", { ascending: true, nullsFirst: false })
        .returns<CaseRow[]>(),

      supabase
        .from("design_versions")
        .select("id, case_id, status, version_number")
        .eq("lab_id", labId)
        .returns<DesignVersionRow[]>(),

      supabase
        .from("case_files")
        .select("id, case_id, category")
        .eq("lab_id", labId)
        .in("category", SOURCE_FILE_CATEGORIES)
        .returns<CaseFileRow[]>(),
    ]);

  if (error) throw new Error(error.message);

  const caseIds = new Set((cases ?? []).map((c) => c.id));

  // Index design versions by case
  const versionsByCase = new Map<string, DesignVersionRow[]>();
  for (const version of designVersions ?? []) {
    if (!caseIds.has(version.case_id)) continue;
    const existing = versionsByCase.get(version.case_id) ?? [];
    existing.push(version);
    versionsByCase.set(version.case_id, existing);
  }

  // Index source files by case
  const sourceFilesByCaseId = new Set<string>();
  for (const file of caseFiles ?? []) {
    if (caseIds.has(file.case_id)) sourceFilesByCaseId.add(file.case_id);
  }

  const items: DesignQueueItem[] = (cases ?? [])
    .filter((row) => isDesignStage(row.current_stage ?? row.stage))
    .map((row) => {
      const stage = (row.current_stage ?? row.stage) as DesignQueueStage;
      const versions = versionsByCase.get(row.id) ?? [];
      // Sort by version_number descending to get the latest
      const latestVersion = versions.sort(
        (a, b) => b.version_number - a.version_number,
      )[0];

      return {
        id: row.id,
        caseNumber: row.case_number,
        patientName: row.patient_name ?? row.patient_display,
        doctorName: row.doctors?.display_name ?? "Unknown doctor",
        clinicName: row.clinics?.name ?? null,
        workType: row.work_type ?? row.restoration_type,
        dueDate: row.due_date ?? null,
        isUrgent: row.is_urgent ?? false,
        currentStage: stage,
        designVersionsCount: versions.length,
        latestDesignStatus: latestVersion?.status ?? null,
        hasSourceFiles: sourceFilesByCaseId.has(row.id),
      };
    });

  const totalByStage: Record<DesignQueueStage, number> = {
    cad_design: 0,
    doctor_approval: 0,
    design_review: 0,
  };
  for (const item of items) {
    totalByStage[item.currentStage] = (totalByStage[item.currentStage] ?? 0) + 1;
  }

  return { items, totalByStage };
}
