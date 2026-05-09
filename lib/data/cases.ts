import { notFound } from "next/navigation";
import {
  productionStages,
  type ProductionStage,
} from "@/lib/constants/workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type CaseListFilters = {
  query?: string;
  status?: string;
  stage?: string;
  doctorId?: string;
  overdue?: boolean;
  urgent?: boolean;
};

export type CaseListItem = {
  id: string;
  caseNumber: string;
  doctorName: string;
  doctorId: string;
  clinicName: string;
  patientName: string;
  workType: string;
  material: string | null;
  status: string;
  currentStage: string;
  priorityScore: number;
  dueDate: string | null;
  isUrgent: boolean;
  isOverdue: boolean;
  missingInfoStatus: string;
};

export type CaseDetail = CaseListItem & {
  shade: string | null;
  unitsCount: number;
  toothNumbers: number[];
  isRemake: boolean;
  isWarranty: boolean;
  requiresDoctorApproval: boolean;
  notes: string | null;
  totalPrice: number;
  missingInfoFields: string[];
  stageHistory: Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    notes: string | null;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    eventType: string;
    title: string;
    createdAt: string;
  }>;
  filesCount: number;
};

type CaseRow = {
  id: string;
  case_number: string;
  doctor_id: string;
  clinic_id: string;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  material: string | null;
  status: string | null;
  current_stage: string | null;
  stage: string;
  priority_score: number | null;
  due_date: string | null;
  is_urgent: boolean | null;
  missing_info_status: string | null;
  doctors: { display_name: string } | null;
  clinics: { name: string } | null;
};

type CaseDetailRow = CaseRow & {
  shade: string | null;
  units_count: number | null;
  tooth_numbers: number[] | null;
  is_remake: boolean | null;
  is_warranty: boolean | null;
  requires_doctor_approval: boolean | null;
  notes: string | null;
  clinical_notes: string | null;
  total_price: number | null;
  missing_info_fields: unknown;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

function isOverdue(dueDate: string | null, status: string) {
  return Boolean(
    dueDate &&
      dueDate < new Date().toISOString().slice(0, 10) &&
      !["completed", "cancelled", "archived"].includes(status),
  );
}

function isProductionStage(value?: string): value is ProductionStage {
  return Boolean(
    value && productionStages.includes(value as ProductionStage),
  );
}

function toListItem(row: CaseRow): CaseListItem {
  const status = row.status ?? "open";

  return {
    id: row.id,
    caseNumber: row.case_number,
    doctorId: row.doctor_id,
    doctorName: row.doctors?.display_name ?? "Unknown doctor",
    clinicName: row.clinics?.name ?? "Unknown clinic",
    patientName: row.patient_name ?? row.patient_display,
    workType: row.work_type ?? row.restoration_type,
    material: row.material,
    status,
    currentStage: row.current_stage ?? row.stage,
    priorityScore: Number(row.priority_score ?? 0),
    dueDate: row.due_date,
    isUrgent: Boolean(row.is_urgent),
    isOverdue: isOverdue(row.due_date, status),
    missingInfoStatus: row.missing_info_status ?? "complete",
  };
}

export async function getCaseList(
  session: AuthSessionContext,
  filters: CaseListFilters,
) {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("cases")
    .select(
      "id, case_number, doctor_id, clinic_id, patient_name, patient_display, work_type, restoration_type, material, status, current_stage, stage, priority_score, due_date, is_urgent, missing_info_status, doctors(display_name), clinics(name)",
    )
    .eq("lab_id", labId)
    .order("priority_score", { ascending: false })
    .order("due_date", { ascending: true });

  if (filters.status) query = query.eq("status", filters.status);
  if (isProductionStage(filters.stage)) {
    query = query.eq("current_stage", filters.stage);
  }
  if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
  if (filters.urgent) query = query.eq("is_urgent", true);
  if (filters.overdue) {
    query = query.lt("due_date", new Date().toISOString().slice(0, 10));
  }

  const [{ data: cases, error }, { data: doctors, error: doctorsError }] =
    await Promise.all([
      query.limit(150).returns<CaseRow[]>(),
      supabase
        .from("doctors")
        .select("id, display_name")
        .eq("lab_id", labId)
        .order("display_name")
        .returns<Array<{ id: string; display_name: string }>>(),
    ]);

  if (error ?? doctorsError) {
    throw new Error((error ?? doctorsError)?.message);
  }

  let items = (cases ?? []).map(toListItem);

  if (filters.query) {
    const needle = filters.query.toLowerCase();
    items = items.filter((item) =>
      [item.caseNumber, item.doctorName, item.patientName]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }

  return {
    cases: items,
    doctors: doctors?.map((doctor) => ({
      id: doctor.id,
      name: doctor.display_name,
    })) ?? [],
  };
}

export async function getCaseDetail(
  session: AuthSessionContext,
  caseId: string,
  canViewFinance: boolean,
) {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const [
    { data: row, error: caseError },
    { data: stageLogs, error: stageError },
    { data: timeline, error: timelineError },
    { count: filesCount, error: filesError },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, case_number, doctor_id, clinic_id, patient_name, patient_display, work_type, restoration_type, material, status, current_stage, stage, priority_score, due_date, is_urgent, missing_info_status, doctors(display_name), clinics(name), shade, units_count, tooth_numbers, is_remake, is_warranty, requires_doctor_approval, notes, clinical_notes, total_price, missing_info_fields",
      )
      .eq("lab_id", labId)
      .eq("id", caseId)
      .maybeSingle<CaseDetailRow>(),
    supabase
      .from("case_stage_logs")
      .select("id, from_stage, to_stage, notes, created_at")
      .eq("lab_id", labId)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          from_stage: string | null;
          to_stage: string;
          notes: string | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("case_timeline")
      .select("id, event_type, title, created_at")
      .eq("lab_id", labId)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          event_type: string;
          title: string;
          created_at: string;
        }>
      >(),
    supabase
      .from("case_files")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("case_id", caseId),
  ]);

  const error = caseError ?? stageError ?? timelineError ?? filesError;

  if (error) throw new Error(error.message);
  if (!row) notFound();

  const base = toListItem(row);
  const missingInfoFields = Array.isArray(row.missing_info_fields)
    ? row.missing_info_fields.filter((item): item is string => typeof item === "string")
    : [];

  return {
    ...base,
    shade: row.shade,
    unitsCount: Number(row.units_count ?? 1),
    toothNumbers: row.tooth_numbers ?? [],
    isRemake: Boolean(row.is_remake),
    isWarranty: Boolean(row.is_warranty),
    requiresDoctorApproval: Boolean(row.requires_doctor_approval),
    notes: row.notes ?? row.clinical_notes,
    totalPrice: canViewFinance ? Number(row.total_price ?? 0) : 0,
    missingInfoFields,
    filesCount: filesCount ?? 0,
    stageHistory: (stageLogs ?? []).map((item) => ({
      id: item.id,
      fromStage: item.from_stage,
      toStage: item.to_stage,
      notes: item.notes,
      createdAt: item.created_at,
    })),
    timeline: (timeline ?? []).map((item) => ({
      id: item.id,
      eventType: item.event_type,
      title: item.title,
      createdAt: item.created_at,
    })),
  } satisfies CaseDetail;
}
