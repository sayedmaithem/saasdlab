import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

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
