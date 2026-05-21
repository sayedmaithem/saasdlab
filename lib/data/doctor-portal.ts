import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

// ─── Types for new case form data ────────────────────────────────────────────

export type DoctorClinicOption = { id: string; name: string };
export type DoctorOperationOption = { id: string; name: string; code: string | null; category: string | null };
export type DoctorMaterialOption = { id: string; name: string; code: string | null; shadeRequired: boolean };

export type DoctorPortalFormData = {
  /** null means no doctor record is linked to this Auth user */
  doctorId: string | null;
  doctorName: string;
  defaultClinicId: string | null;
  clinics: DoctorClinicOption[];
  operations: DoctorOperationOption[];
  materials: DoctorMaterialOption[];
};

export type DoctorPortalCase = {
  id: string;
  caseNumber: string;
  patientName: string;
  workType: string;
  status: string;
  currentStage: string;
  dueDate: string | null;
  missingInfoStatus: string;
};

export type DoctorPortalData = {
  doctorId: string | null;
  doctorName: string;
  cases: DoctorPortalCase[];
  cards: Array<{ label: string; value: string; hint: string }>;
};

type DoctorRow = { id: string; display_name: string };
type CaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  status: string | null;
  current_stage: string | null;
  due_date: string | null;
  missing_info_status: string | null;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) throw new Error("No active lab was found.");
  return session.activeLabId;
}

export async function getDoctorPortalData(
  session: AuthSessionContext,
  filters: { query?: string; status?: string; waitingInfo?: boolean; approval?: boolean } = {},
): Promise<DoctorPortalData> {
  const labId = assertLab(session);
  if (!hasSupabaseEnv()) {
    return {
      doctorId: null,
      doctorName: "Doctor portal",
      cases: [],
      cards: [
        { label: "Active cases", value: "0", hint: "Connected after Supabase setup" },
        { label: "Waiting info", value: "0", hint: "Missing case data" },
        { label: "Design approvals", value: "0", hint: "Pending responses" },
        { label: "Current balance", value: "$0", hint: "Statement balance" },
      ],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id, display_name")
    .eq("lab_id", labId)
    .eq("profile_id", session.userId)
    .maybeSingle<DoctorRow>();
  if (doctorError) throw new Error(doctorError.message);
  if (!doctor) {
    return { doctorId: null, doctorName: "Doctor portal", cases: [], cards: [] };
  }

  let query = supabase
    .from("cases")
    .select("id, case_number, patient_name, patient_display, work_type, restoration_type, status, current_stage, due_date, missing_info_status")
    .eq("lab_id", labId)
    .eq("doctor_id", doctor.id)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.waitingInfo) query = query.eq("missing_info_status", "missing");
  if (filters.approval) query = query.eq("current_stage", "doctor_approval");

  const { data: cases, error } = await query.returns<CaseRow[]>();
  if (error) throw new Error(error.message);

  let items = (cases ?? []).map((item) => ({
    id: item.id,
    caseNumber: item.case_number,
    patientName: item.patient_name ?? item.patient_display,
    workType: item.work_type ?? item.restoration_type,
    status: item.status ?? "active",
    currentStage: item.current_stage ?? "received",
    dueDate: item.due_date,
    missingInfoStatus: item.missing_info_status ?? "complete",
  }));
  if (filters.query) {
    const needle = filters.query.toLowerCase();
    items = items.filter((item) => `${item.caseNumber} ${item.patientName}`.toLowerCase().includes(needle));
  }

  return {
    doctorId: doctor.id,
    doctorName: doctor.display_name,
    cases: items,
    cards: [
      { label: "My active cases", value: String(items.filter((item) => !["completed", "cancelled"].includes(item.status)).length), hint: "Open lab work" },
      { label: "Waiting my info", value: String(items.filter((item) => item.missingInfoStatus === "missing").length), hint: "Needs files or details" },
      { label: "Design approval", value: String(items.filter((item) => item.currentStage === "doctor_approval").length), hint: "Awaiting response" },
      { label: "Ready delivery", value: String(items.filter((item) => item.currentStage === "ready_for_delivery").length), hint: "Ready at the lab" },
    ],
  };
}

// ─── Form data for the new-case page ─────────────────────────────────────────

type DoctorClinicsRow = { id: string; name: string };
type DoctorOperationsRow = { id: string; name: string; code: string | null; category: string | null };
type DoctorMaterialsRow = { id: string; name: string; code: string | null; shade_required: boolean };

/**
 * Fetches everything the doctor needs to fill in a new case:
 *   - their own doctor record (id, name, default clinic)
 *   - their linked clinics (from doctor_clinics join)
 *   - active lab operations from the catalog
 *   - active lab materials from the catalog
 *
 * Returns { doctorId: null } when the session user has no linked doctor record.
 */
export async function getDoctorPortalFormData(
  session: AuthSessionContext,
): Promise<DoctorPortalFormData> {
  const labId = assertLab(session);

  const empty: DoctorPortalFormData = {
    doctorId: null,
    doctorName: "",
    defaultClinicId: null,
    clinics: [],
    operations: [],
    materials: [],
  };

  if (!hasSupabaseEnv()) return empty;

  const supabase = await createSupabaseServerClient();

  // 1. Resolve linked doctor
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id, display_name, default_clinic_id")
    .eq("lab_id", labId)
    .eq("profile_id", session.userId)
    .maybeSingle<{ id: string; display_name: string; default_clinic_id: string | null }>();

  if (doctorError) throw new Error(doctorError.message);
  if (!doctor) return empty;

  // 2. Fetch clinics linked to this doctor via doctor_clinics table
  //    Fall back to default_clinic_id if doctor_clinics is empty.
  const [
    { data: linkedClinics, error: clinicsError },
    { data: operations, error: opsError },
    { data: materials, error: matsError },
  ] = await Promise.all([
    supabase
      .from("doctor_clinics")
      .select("clinics(id, name)")
      .eq("lab_id", labId)
      .eq("doctor_id", doctor.id)
      .returns<Array<{ clinics: DoctorClinicsRow | null }>>(),
    supabase
      .from("lab_operations")
      .select("id, name, code, category")
      .eq("lab_id", labId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name")
      .returns<DoctorOperationsRow[]>(),
    supabase
      .from("lab_materials")
      .select("id, name, code, shade_required")
      .eq("lab_id", labId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name")
      .returns<DoctorMaterialsRow[]>(),
  ]);

  if (clinicsError) throw new Error(clinicsError.message);
  if (opsError) throw new Error(opsError.message);
  if (matsError) throw new Error(matsError.message);

  // Build clinic options: prefer doctor_clinics join, fall back to default_clinic_id
  let clinicOptions: DoctorClinicOption[] = (linkedClinics ?? [])
    .map((row) => row.clinics)
    .filter((c): c is DoctorClinicsRow => c !== null)
    .map((c) => ({ id: c.id, name: c.name }));

  if (clinicOptions.length === 0 && doctor.default_clinic_id) {
    // Fetch the default clinic name
    const { data: defaultClinic } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("id", doctor.default_clinic_id)
      .maybeSingle<DoctorClinicsRow>();
    if (defaultClinic) clinicOptions = [{ id: defaultClinic.id, name: defaultClinic.name }];
  }

  return {
    doctorId: doctor.id,
    doctorName: doctor.display_name,
    defaultClinicId: doctor.default_clinic_id,
    clinics: clinicOptions,
    operations: (operations ?? []).map((op) => ({
      id: op.id,
      name: op.name,
      code: op.code,
      category: op.category,
    })),
    materials: (materials ?? []).map((mat) => ({
      id: mat.id,
      name: mat.name,
      code: mat.code,
      shadeRequired: mat.shade_required,
    })),
  };
}
