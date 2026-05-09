"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { checkMissingInformation } from "@/lib/cases/missing-info";
import {
  canUploadCaseFile,
  canViewCaseFile,
  type CaseFileAccessCase,
} from "@/lib/files/case-file-permissions";
import {
  CASE_FILES_BUCKET,
  caseFileCategories,
  caseFileCategoryConfig,
  caseFileVisibilities,
  validateCaseFileInput,
  type CaseFileCategory,
  type CaseFileVisibility,
} from "@/lib/files/case-file-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateCaseInput } from "@/lib/validations/case";

export type CaseFileActionState = {
  ok: boolean;
  message: string;
  url?: string;
  fileId?: string;
};

const registerCaseFileSchema = z.object({
  caseId: z.uuid(),
  storagePath: z.string().min(10).max(900),
  category: z.enum(caseFileCategories),
  visibility: z.enum(caseFileVisibilities),
  fileName: z.string().min(1).max(255),
  fileSize: z.coerce.number().int().positive(),
  mimeType: z.string().max(160).optional().nullable(),
  designVersionId: z.uuid().optional().nullable(),
});

type CaseAccessRow = {
  id: string;
  lab_id: string;
  doctor_id: string;
  assigned_technician_id: string | null;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  material: string | null;
  shade: string | null;
  units_count: number | null;
  tooth_numbers: number[] | null;
  due_date: string | null;
  is_urgent: boolean | null;
  is_remake: boolean | null;
  is_warranty: boolean | null;
  requires_doctor_approval: boolean | null;
  physical_impression_received: boolean | null;
  preparation_photo_received: boolean | null;
  implant_system: string | null;
  scan_body_info: string | null;
  bite_info: string | null;
  arch: "" | "upper" | "lower" | "both" | null;
  complexity: "simple" | "standard" | "complex" | null;
  status: string | null;
  current_stage: string | null;
  doctors: { profile_id: string | null } | null;
};

type CaseFileRecordRow = {
  id: string;
  lab_id: string;
  case_id: string;
  storage_path: string;
  file_name: string;
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
  uploaded_by: string | null;
  cases: {
    doctor_id: string;
    assigned_technician_id: string | null;
    doctors: { profile_id: string | null } | null;
  } | null;
};

function toAccessCase(row: CaseAccessRow): CaseFileAccessCase {
  return {
    labId: row.lab_id,
    doctorProfileId: row.doctors?.profile_id ?? null,
    assignedTechnicianId: row.assigned_technician_id,
  };
}

function normalizeVisibility(params: {
  roles: string[];
  userId: string;
  item: CaseFileAccessCase;
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
}) {
  if (params.category === "invoices" && params.roles.includes("accountant")) {
    return "private_finance";
  }

  if (params.item.doctorProfileId === params.userId) {
    return "doctor_visible";
  }

  return params.visibility;
}

function toMissingInfoInput(row: CaseAccessRow): CreateCaseInput {
  return {
    doctorId: row.doctor_id,
    clinicId: "00000000-0000-0000-0000-000000000000",
    patientName: row.patient_name ?? row.patient_display,
    workType: (
      row.work_type ?? row.restoration_type
    ) as CreateCaseInput["workType"],
    material: row.material ?? undefined,
    shade: row.shade ?? undefined,
    unitsCount: Number(row.units_count ?? 1),
    toothNumbers: row.tooth_numbers?.join(", ") ?? "",
    dueDate: row.due_date ?? "",
    isUrgent: Boolean(row.is_urgent),
    isRemake: Boolean(row.is_remake),
    isWarranty: Boolean(row.is_warranty),
    requiresDoctorApproval: Boolean(row.requires_doctor_approval),
    physicalImpressionReceived: Boolean(row.physical_impression_received),
    preparationPhotoReceived: Boolean(row.preparation_photo_received),
    implantSystem: row.implant_system ?? undefined,
    scanBodyInfo: row.scan_body_info ?? undefined,
    biteInfo: row.bite_info ?? undefined,
    arch: row.arch ?? "",
    complexity: row.complexity ?? "standard",
    notes: undefined,
  };
}

async function refreshMissingInformation(params: {
  caseRow: CaseAccessRow;
  uploadedBy: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: files, error: filesError } = await supabase
    .from("case_files")
    .select("category, file_type, file_kind")
    .eq("lab_id", params.caseRow.lab_id)
    .eq("case_id", params.caseRow.id)
    .returns<
      Array<{
        category: string;
        file_type: string | null;
        file_kind: string;
      }>
    >();

  if (filesError) throw new Error(filesError.message);

  const result = checkMissingInformation(
    toMissingInfoInput(params.caseRow),
    (files ?? []).map((file) => ({
      category: file.category,
      fileType: file.file_type ?? file.file_kind,
    })),
  );
  const shouldMoveToInfoCheck =
    result.status === "complete" &&
    params.caseRow.status === "waiting_doctor_info";
  const informationCheckStage = "information_check" as const;

  const updatePayload = shouldMoveToInfoCheck
    ? {
        missing_info_status: result.status,
        missing_info_fields: result.requiredMissing,
        status: "active",
        current_stage: informationCheckStage,
        stage: informationCheckStage,
        updated_at: new Date().toISOString(),
      }
    : {
        missing_info_status: result.status,
        missing_info_fields: result.requiredMissing,
        updated_at: new Date().toISOString(),
      };

  const { error: caseError } = await supabase
    .from("cases")
    .update(updatePayload)
    .eq("lab_id", params.caseRow.lab_id)
    .eq("id", params.caseRow.id);

  if (caseError) throw new Error(caseError.message);

  if (shouldMoveToInfoCheck) {
    const { error: stageError } = await supabase.from("case_stage_logs").insert({
      lab_id: params.caseRow.lab_id,
      case_id: params.caseRow.id,
      from_stage: "waiting_doctor_info",
      to_stage: "information_check",
      changed_by: params.uploadedBy,
      notes: "Required case information completed after file upload.",
    });

    if (stageError) throw new Error(stageError.message);
  }
}

export async function registerCaseFileAction(
  input: unknown,
): Promise<CaseFileActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = registerCaseFileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid file upload.",
    };
  }

  const payload = parsed.data;
  const validation = validateCaseFileInput({
    name: payload.fileName,
    size: payload.fileSize,
  });

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const expectedFolder = caseFileCategoryConfig[payload.category].folder;
  const expectedPrefix = `${session.activeLabId}/${payload.caseId}/${expectedFolder}/`;

  if (!payload.storagePath.startsWith(expectedPrefix)) {
    return { ok: false, message: "File path does not match this case." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select(
      "id, lab_id, doctor_id, assigned_technician_id, patient_name, patient_display, work_type, restoration_type, material, shade, units_count, tooth_numbers, due_date, is_urgent, is_remake, is_warranty, requires_doctor_approval, physical_impression_received, preparation_photo_received, implant_system, scan_body_info, bite_info, arch, complexity, status, current_stage, doctors(profile_id)",
    )
    .eq("lab_id", session.activeLabId)
    .eq("id", payload.caseId)
    .maybeSingle<CaseAccessRow>();

  if (caseError) return { ok: false, message: caseError.message };
  if (!caseRow) return { ok: false, message: "Case was not found." };

  const accessCase = toAccessCase(caseRow);
  const visibility = normalizeVisibility({
    roles: session.roles,
    userId: session.userId,
    item: accessCase,
    category: payload.category,
    visibility: payload.visibility,
  });

  if (
    !canUploadCaseFile({
      roles: session.roles,
      userId: session.userId,
      item: accessCase,
      category: payload.category,
      visibility,
    })
  ) {
    return { ok: false, message: "You do not have permission to upload here." };
  }

  const { data: fileRow, error: insertError } = await supabase
    .from("case_files")
    .insert({
      lab_id: session.activeLabId,
      case_id: payload.caseId,
      design_version_id: payload.designVersionId ?? null,
      bucket: CASE_FILES_BUCKET,
      storage_path: payload.storagePath,
      file_path: payload.storagePath,
      category: payload.category,
      file_kind: validation.fileType,
      file_type: validation.fileType,
      file_name: payload.fileName,
      mime_type: payload.mimeType ?? null,
      size_bytes: payload.fileSize,
      file_size: payload.fileSize,
      visibility,
      uploaded_by: session.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  const { error: timelineError } = await supabase.from("case_timeline").insert({
    lab_id: session.activeLabId,
    case_id: payload.caseId,
    actor_id: session.userId,
    event_type: "file_uploaded",
    title: `${payload.fileName} uploaded.`,
    metadata: {
      file_id: fileRow.id,
      category: payload.category,
      visibility,
      file_type: validation.fileType,
      file_size: payload.fileSize,
    },
  });

  if (timelineError) {
    return { ok: false, message: timelineError.message };
  }

  await refreshMissingInformation({
    caseRow,
    uploadedBy: session.userId,
  });

  revalidatePath(`/cases/${payload.caseId}`);
  revalidatePath("/cases");

  return {
    ok: true,
    message: `${payload.fileName} uploaded.`,
    fileId: fileRow.id,
  };
}

export async function createCaseFileDownloadUrlAction(
  fileId: string,
): Promise<CaseFileActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: file, error } = await supabase
    .from("case_files")
    .select(
      "id, lab_id, case_id, storage_path, file_name, category, visibility, uploaded_by, cases(doctor_id, assigned_technician_id, doctors(profile_id))",
    )
    .eq("lab_id", session.activeLabId)
    .eq("id", fileId)
    .maybeSingle<CaseFileRecordRow>();

  if (error) return { ok: false, message: error.message };
  if (!file) return { ok: false, message: "File was not found." };

  const accessCase: CaseFileAccessCase = {
    labId: file.lab_id,
    doctorProfileId: file.cases?.doctors?.profile_id ?? null,
    assignedTechnicianId: file.cases?.assigned_technician_id ?? null,
  };

  if (
    !canViewCaseFile({
      roles: session.roles,
      userId: session.userId,
      item: accessCase,
      file: {
        category: file.category,
        visibility: file.visibility,
        uploadedBy: file.uploaded_by,
      },
    })
  ) {
    return { ok: false, message: "You do not have access to this file." };
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(CASE_FILES_BUCKET)
    .createSignedUrl(file.storage_path, 300, {
      download: file.file_name,
    });

  if (signedUrlError) {
    return { ok: false, message: signedUrlError.message };
  }

  return {
    ok: true,
    message: "Signed URL created.",
    url: signedUrl.signedUrl,
  };
}
