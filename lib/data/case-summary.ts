import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { stageLabels } from "@/lib/constants/workflow";
import type { AuthSessionContext } from "@/types/app";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CaseSummaryUnit {
  id: string;
  tooth_numbers: number[];
  work_type: string;
  material: string | null;
  units_count: number;
}

export interface CaseSummaryTimeline {
  id: string;
  event_type: string;
  title: string;
  created_at: string;
}

export interface CaseSummaryStageLog {
  id: string;
  from_stage: string | null;
  to_stage: string;
  notes: string | null;
  created_at: string;
}

export interface CaseSummaryData {
  id: string;
  caseNumber: string;
  status: string;
  currentStage: string;
  currentStageLabel: string;
  isUrgent: boolean;
  missingInfoStatus: string;

  createdAt: string;
  dueDate: string | null;

  doctorName: string | null;
  doctorPhone: string | null;
  doctorEmail: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;

  patientName: string;
  arch: string | null;
  toothNumbers: number[];

  workType: string;
  material: string | null;
  shade: string | null;
  unitsCount: number;
  totalPrice: number;

  notes: string | null;

  /** Assigned technician display name (null if none assigned) */
  assignedTechnicianName: string | null;
  /** Total case files uploaded */
  filesCount: number;

  units: CaseSummaryUnit[];
  /** Last 10 timeline events, descending */
  timeline: CaseSummaryTimeline[];
  /** Full stage transition history, ascending */
  stageHistory: CaseSummaryStageLog[];
  labName: string | null;
}

// ── Internal raw types ────────────────────────────────────────────────────────

type CaseRow = {
  id: string;
  case_number: string;
  status?: string | null;
  current_stage?: string | null;
  stage?: string | null;
  is_urgent?: boolean | null;
  missing_info_status?: string | null;
  created_at: string;
  due_date?: string | null;
  patient_name?: string | null;
  patient_display: string;
  arch?: string | null;
  tooth_numbers?: number[] | null;
  work_type?: string | null;
  restoration_type?: string | null;
  material?: string | null;
  shade?: string | null;
  units_count?: number | null;
  total_price?: number | null;
  notes?: string | null;
  assigned_technician_id?: string | null;
  // Supabase returns embedded relations as object or array
  // doctors.display_name (not doctors.name)
  doctors?: { display_name?: string; phone?: string | null; email?: string | null } | null;
  clinics?: { name?: string; address?: string | null; phone?: string | null } | null;
};

type ItemRow = {
  id: string;
  tooth_numbers: unknown;
  work_type: string;
  material: string | null;
  units_count: number;
};

type TimelineRow = {
  id: string;
  event_type: string;
  title: string;
  created_at: string;
};

type StageLogRow = {
  id: string;
  from_stage: string | null;
  to_stage: string;
  notes: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type TechnicianRow = {
  id: string;
  display_name: string;
  profile_id: string | null;
};

// ── Query ─────────────────────────────────────────────────────────────────────

export async function getCaseSummaryData(
  session: AuthSessionContext,
  caseId: string,
): Promise<CaseSummaryData> {
  if (!hasSupabaseEnv() || !session.activeLabId) {
    notFound();
  }

  const labId = session.activeLabId;
  // Cast as any: generated types don't cover all joined relations cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createSupabaseServerClient() as any;

  // ── Core case query with doctor and clinic ──────────────────
  const { data: c, error } = await supabase
    .from("cases")
    .select(`
      id,
      case_number,
      status,
      current_stage,
      stage,
      is_urgent,
      missing_info_status,
      created_at,
      due_date,
      patient_name,
      patient_display,
      arch,
      tooth_numbers,
      work_type,
      restoration_type,
      material,
      shade,
      units_count,
      total_price,
      notes,
      assigned_technician_id,
      doctors ( display_name, phone, email ),
      clinics ( name, address, phone )
    `)
    .eq("id", caseId)
    .eq("lab_id", labId)
    .single() as { data: CaseRow | null; error: { message: string } | null };

  if (error || !c) {
    notFound();
  }

  // ── Parallel supplementary queries ─────────────────────────
  const [itemsResult, timelineResult, stageLogsResult, filesResult] = await Promise.all([
    // Case line items
    supabase
      .from("case_items")
      .select("id, tooth_numbers, work_type, material, units_count")
      .eq("case_id", caseId)
      .order("created_at") as Promise<{ data: ItemRow[] | null }>,

    // Last 10 timeline events
    supabase
      .from("case_timeline")
      .select("id, event_type, title, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(10) as Promise<{ data: TimelineRow[] | null }>,

    // Stage transition history (ascending — oldest first for the log)
    supabase
      .from("case_stage_logs")
      .select("id, from_stage, to_stage, notes, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true }) as Promise<{ data: StageLogRow[] | null }>,

    // File count
    supabase
      .from("case_files")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId) as Promise<{ count: number | null }>,
  ]);

  // ── Resolve assigned technician name ───────────────────────
  let assignedTechnicianName: string | null = null;

  if (c.assigned_technician_id) {
    // assigned_technician_id references profiles.id
    // Try to find a matching technician record via profile_id
    const { data: techRow } = await supabase
      .from("technicians")
      .select("id, display_name, profile_id")
      .eq("lab_id", labId)
      .eq("profile_id", c.assigned_technician_id)
      .maybeSingle() as { data: TechnicianRow | null };

    if (techRow) {
      assignedTechnicianName = techRow.display_name;
    } else {
      // Fallback: look up the profile directly
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", c.assigned_technician_id)
        .maybeSingle() as { data: ProfileRow | null };
      assignedTechnicianName = profileRow?.full_name ?? null;
    }
  }

  // ── Normalise relation objects ─────────────────────────────
  const doctor = Array.isArray(c.doctors) ? c.doctors[0] : c.doctors;
  const clinic = Array.isArray(c.clinics) ? c.clinics[0] : c.clinics;

  // ── Build response ────────────────────────────────────────
  const stage = (c.current_stage ?? c.stage ?? "received") as string;

  const units: CaseSummaryUnit[] = (itemsResult.data ?? []).map((u) => ({
    id: u.id,
    tooth_numbers: Array.isArray(u.tooth_numbers) ? (u.tooth_numbers as number[]) : [],
    work_type: u.work_type ?? "",
    material: u.material ?? null,
    units_count: u.units_count ?? 1,
  }));

  const timeline: CaseSummaryTimeline[] = (timelineResult.data ?? []).map((t) => ({
    id: t.id,
    event_type: t.event_type,
    title: t.title,
    created_at: t.created_at,
  }));

  const stageHistory: CaseSummaryStageLog[] = (stageLogsResult.data ?? []).map((s) => ({
    id: s.id,
    from_stage: s.from_stage ?? null,
    to_stage: s.to_stage,
    notes: s.notes ?? null,
    created_at: s.created_at,
  }));

  return {
    id: c.id,
    caseNumber: c.case_number,
    status: c.status ?? "open",
    currentStage: stage,
    currentStageLabel:
      stageLabels[stage as keyof typeof stageLabels] ??
      stage.replaceAll("_", " "),
    isUrgent: c.is_urgent ?? false,
    missingInfoStatus: c.missing_info_status ?? "complete",
    createdAt: c.created_at,
    dueDate: c.due_date ?? null,
    doctorName: doctor?.display_name ?? null,
    doctorPhone: doctor?.phone ?? null,
    doctorEmail: doctor?.email ?? null,
    clinicName: clinic?.name ?? null,
    clinicAddress: clinic?.address ?? null,
    clinicPhone: clinic?.phone ?? null,
    patientName: c.patient_name ?? c.patient_display ?? "Unknown",
    arch: c.arch ?? null,
    toothNumbers: Array.isArray(c.tooth_numbers) ? (c.tooth_numbers as number[]) : [],
    workType: c.work_type ?? c.restoration_type ?? "",
    material: c.material ?? null,
    shade: c.shade ?? null,
    unitsCount: c.units_count ?? 0,
    totalPrice: Number(c.total_price ?? 0),
    notes: c.notes ?? null,
    assignedTechnicianName,
    filesCount: filesResult.count ?? 0,
    units,
    timeline,
    stageHistory,
    labName: session.labName ?? null,
  };
}
