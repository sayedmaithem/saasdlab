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

export interface CaseSummaryData {
  id: string;
  caseNumber: string;
  status: string;
  currentStage: string;
  currentStageLabel: string;
  isUrgent: boolean;

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

  notes: string | null;

  units: CaseSummaryUnit[];
  timeline: CaseSummaryTimeline[];
  labName: string | null;
}

// ── Internal raw types for query results ──────────────────────────────────────

type CaseRow = {
  id: string;
  case_number: string;
  status?: string | null;
  current_stage?: string | null;
  stage?: string | null;
  is_urgent?: boolean | null;
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
  notes?: string | null;
  doctors?: { name?: string; phone?: string | null; email?: string | null } | null;
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

// ── Query ─────────────────────────────────────────────────────────────────────

export async function getCaseSummaryData(
  session: AuthSessionContext,
  caseId: string,
): Promise<CaseSummaryData> {
  if (!hasSupabaseEnv() || !session.activeLabId) {
    notFound();
  }

  const labId = session.activeLabId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createSupabaseServerClient() as any;

  const { data: c, error } = await supabase
    .from("cases")
    .select(`
      id,
      case_number,
      status,
      current_stage,
      stage,
      is_urgent,
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
      notes,
      doctors ( name, phone, email ),
      clinics ( name, address, phone )
    `)
    .eq("id", caseId)
    .eq("lab_id", labId)
    .single() as { data: CaseRow | null; error: { message: string } | null };

  if (error || !c) {
    notFound();
  }

  const { data: itemsRaw } = await supabase
    .from("case_items")
    .select("id, tooth_numbers, work_type, material, units_count")
    .eq("case_id", caseId)
    .order("created_at") as { data: ItemRow[] | null };

  const { data: timelineRaw } = await supabase
    .from("case_timeline")
    .select("id, event_type, title, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(10) as { data: TimelineRow[] | null };

  const doctor = Array.isArray(c.doctors) ? c.doctors[0] : c.doctors;
  const clinic = Array.isArray(c.clinics) ? c.clinics[0] : c.clinics;

  const units: CaseSummaryUnit[] = (itemsRaw ?? []).map((u) => ({
    id: u.id,
    tooth_numbers: Array.isArray(u.tooth_numbers) ? (u.tooth_numbers as number[]) : [],
    work_type: u.work_type ?? "",
    material: u.material ?? null,
    units_count: u.units_count ?? 1,
  }));

  const timeline: CaseSummaryTimeline[] = (timelineRaw ?? []).map((t) => ({
    id: t.id,
    event_type: t.event_type,
    title: t.title,
    created_at: t.created_at,
  }));

  const stage = (c.current_stage ?? c.stage ?? "received") as string;

  return {
    id: c.id,
    caseNumber: c.case_number,
    status: c.status ?? "open",
    currentStage: stage,
    currentStageLabel:
      stageLabels[stage as keyof typeof stageLabels] ??
      stage.replaceAll("_", " "),
    isUrgent: c.is_urgent ?? false,
    createdAt: c.created_at,
    dueDate: c.due_date ?? null,
    doctorName: doctor?.name ?? null,
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
    notes: c.notes ?? null,
    units,
    timeline,
    labName: session.labName ?? null,
  };
}
