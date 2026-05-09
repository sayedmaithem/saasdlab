import { notFound } from "next/navigation";
import {
  productionStages,
  type ProductionStage,
} from "@/lib/constants/workflow";
import {
  getAllowedUploadCategories,
  getAllowedUploadVisibilities,
  canViewCaseFile,
  type CaseFileAccessCase,
} from "@/lib/files/case-file-permissions";
import type {
  CaseFileCategory,
  CaseFileVisibility,
} from "@/lib/files/case-file-rules";
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
  labId: string;
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
  files: CaseFileItem[];
  allowedUploadCategories: CaseFileCategory[];
  allowedUploadVisibilities: CaseFileVisibility[];
};

export type CaseFileItem = {
  id: string;
  caseId: string;
  designVersionId: string | null;
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string | null;
  uploadedBy: string | null;
  uploadedByName: string;
  uploadedAt: string;
};

type CaseRow = {
  id: string;
  lab_id?: string;
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
  assigned_technician_id?: string | null;
  doctors: { display_name: string; profile_id?: string | null } | null;
  clinics: { name: string } | null;
};

type CaseDetailRow = CaseRow & {
  lab_id: string;
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
  assigned_technician_id: string | null;
  doctors: { display_name: string; profile_id: string | null } | null;
};

type CaseFileRow = {
  id: string;
  case_id: string;
  design_version_id: string | null;
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
  file_name: string;
  file_type: string | null;
  file_kind: string;
  file_size: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
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
	    { data: files, error: filesError },
	  ] = await Promise.all([
    supabase
	      .from("cases")
	      .select(
	        "id, lab_id, case_number, doctor_id, clinic_id, patient_name, patient_display, work_type, restoration_type, material, status, current_stage, stage, priority_score, due_date, is_urgent, missing_info_status, assigned_technician_id, doctors(display_name, profile_id), clinics(name), shade, units_count, tooth_numbers, is_remake, is_warranty, requires_doctor_approval, notes, clinical_notes, total_price, missing_info_fields",
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
	      .select(
	        "id, case_id, design_version_id, category, visibility, file_name, file_type, file_kind, file_size, size_bytes, mime_type, uploaded_by, created_at",
	      )
	      .eq("lab_id", labId)
	      .eq("case_id", caseId)
	      .order("created_at", { ascending: false })
	      .returns<CaseFileRow[]>(),
	  ]);

  const error = caseError ?? stageError ?? timelineError ?? filesError;

  if (error) throw new Error(error.message);
  if (!row) notFound();

	  const base = toListItem(row);
	  const accessCase: CaseFileAccessCase = {
	    labId: row.lab_id,
	    doctorProfileId: row.doctors?.profile_id ?? null,
	    assignedTechnicianId: row.assigned_technician_id,
	  };
	  const missingInfoFields = Array.isArray(row.missing_info_fields)
	    ? row.missing_info_fields.filter((item): item is string => typeof item === "string")
	    : [];
	  const uploaderIds = Array.from(
	    new Set(
	      (files ?? [])
	        .map((file) => file.uploaded_by)
	        .filter((id): id is string => Boolean(id)),
	    ),
	  );
	  const { data: uploaders, error: uploadersError } = uploaderIds.length
	    ? await supabase
	        .from("profiles")
	        .select("id, full_name, email")
	        .in("id", uploaderIds)
	        .returns<Array<{ id: string; full_name: string | null; email: string | null }>>()
	    : { data: [], error: null };

	  if (uploadersError) throw new Error(uploadersError.message);

	  const uploaderMap = new Map(
	    (uploaders ?? []).map((profile) => [
	      profile.id,
	      profile.full_name ?? profile.email ?? "Unknown user",
	    ]),
	  );
	  const visibleFiles = (files ?? [])
	    .filter((file) =>
	      canViewCaseFile({
	        roles: session.roles,
	        userId: session.userId,
	        item: accessCase,
	        file: {
	          category: file.category,
	          visibility: file.visibility,
	          uploadedBy: file.uploaded_by,
	        },
	      }),
	    )
	    .map((file) => ({
	      id: file.id,
	      caseId: file.case_id,
	      designVersionId: file.design_version_id,
	      category: file.category,
	      visibility: file.visibility,
	      fileName: file.file_name,
	      fileType: file.file_type ?? file.file_kind,
	      fileSize: Number(file.file_size ?? file.size_bytes ?? 0),
	      mimeType: file.mime_type,
	      uploadedBy: file.uploaded_by,
	      uploadedByName: file.uploaded_by
	        ? uploaderMap.get(file.uploaded_by) ?? "Unknown user"
	        : "System",
	      uploadedAt: file.created_at,
	    }));

	  return {
	    ...base,
	    labId: row.lab_id,
    shade: row.shade,
    unitsCount: Number(row.units_count ?? 1),
    toothNumbers: row.tooth_numbers ?? [],
    isRemake: Boolean(row.is_remake),
    isWarranty: Boolean(row.is_warranty),
    requiresDoctorApproval: Boolean(row.requires_doctor_approval),
    notes: row.notes ?? row.clinical_notes,
	    totalPrice: canViewFinance ? Number(row.total_price ?? 0) : 0,
	    missingInfoFields,
	    filesCount: visibleFiles.length,
	    files: visibleFiles,
	    allowedUploadCategories: getAllowedUploadCategories({
	      roles: session.roles,
	      userId: session.userId,
	      item: accessCase,
	    }),
	    allowedUploadVisibilities: getAllowedUploadVisibilities({
	      roles: session.roles,
	      userId: session.userId,
	      item: accessCase,
	    }),
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
