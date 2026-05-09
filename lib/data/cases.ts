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
import { hasSupabaseEnv } from "@/lib/env";
import {
  canCreateCaseComment,
  canViewCaseComment,
  getAllowedCommentVisibilities,
  type CommentAccessCase,
  type CommentVisibility,
} from "@/lib/comments/comment-permissions";
import {
  canCommentOnDesignVersion,
  canDecideDesignVersion,
  canUploadDesignVersion,
  type DesignAccessCase,
  type DesignStatus,
} from "@/lib/design/design-workflow";
import { isTimelineEventType, type TimelineEventType } from "@/lib/timeline/events";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";
import type { Json } from "@/types/database";

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
	    eventType: TimelineEventType;
	    title: string;
	    details: string | null;
	    actorName: string;
	    actorRole: AppRole | null;
	    createdAt: string;
	  }>;
  filesCount: number;
  files: CaseFileItem[];
  allowedUploadCategories: CaseFileCategory[];
  allowedUploadVisibilities: CaseFileVisibility[];
  designVersions: DesignVersionItem[];
  canUploadDesignVersion: boolean;
  canDecideDesignVersion: boolean;
  canCommentDesignVersion: boolean;
  comments: CaseCommentItem[];
  canCreateComment: boolean;
  allowedCommentVisibilities: CommentVisibility[];
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

export type DesignVersionItem = {
  id: string;
  versionNumber: number;
  uploadedBy: string | null;
  uploadedByName: string;
  uploadedAt: string;
  status: DesignStatus;
  notes: string | null;
  previewFileId: string | null;
  files: CaseFileItem[];
  doctorResponse: string | null;
  approvalStatus: string | null;
  approvalComment: string | null;
  approvalDecidedAt: string | null;
};

export type CaseCommentItem = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorRole: AppRole | null;
  body: string;
  visibility: CommentVisibility;
  fileId: string | null;
  fileName: string | null;
  createdAt: string;
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

type DesignVersionRow = {
  id: string;
  version_number: number;
  uploaded_by: string | null;
  submitted_by: string | null;
  created_at: string;
  status: DesignStatus;
  notes: string | null;
  preview_file_id: string | null;
  doctor_response: string | null;
  approval_decided_at: string | null;
};

type DesignApprovalRow = {
  design_version_id: string;
  status: string;
  comment: string | null;
  decided_at: string | null;
  created_at: string;
};

type CaseCommentRow = {
  id: string;
  author_id: string | null;
  body: string;
  visibility: CommentVisibility;
  file_id: string | null;
  created_at: string;
};

type TimelineRow = {
  id: string;
  event_type: string;
  title: string;
  metadata: Json;
  actor_id: string | null;
  created_at: string;
};

type ProfileSummaryRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole | null;
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

function getTimelineDetails(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const details = [
    typeof metadata.from_stage === "string" && typeof metadata.to_stage === "string"
      ? `${metadata.from_stage.replaceAll("_", " ")} to ${metadata.to_stage.replaceAll("_", " ")}`
      : null,
    typeof metadata.visibility === "string"
      ? `Visibility: ${metadata.visibility.replaceAll("_", " ")}`
      : null,
    typeof metadata.file_type === "string" ? `File: ${metadata.file_type}` : null,
    typeof metadata.decision === "string"
      ? `Decision: ${metadata.decision.replaceAll("_", " ")}`
      : null,
    typeof metadata.problem === "string" ? `Problem: ${metadata.problem}` : null,
    typeof metadata.delay_reason === "string" ? `Delay: ${metadata.delay_reason}` : null,
    typeof metadata.comment === "string" ? metadata.comment : null,
  ].filter(Boolean);

  return details.length ? details.join(" / ") : null;
}

export async function getCaseList(
  session: AuthSessionContext,
  filters: CaseListFilters,
) {
  const labId = assertLab(session);

  if (!hasSupabaseEnv()) {
    return {
      cases: [],
      doctors: [],
    };
  }

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

  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
	  const [
	    { data: row, error: caseError },
	    { data: stageLogs, error: stageError },
	    { data: timeline, error: timelineError },
	    { data: files, error: filesError },
	    { data: designVersions, error: designError },
	    { data: designApprovals, error: approvalError },
	    { data: comments, error: commentsError },
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
	      .select("id, event_type, title, metadata, actor_id, created_at")
      .eq("lab_id", labId)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .returns<
	        TimelineRow[]
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
	    supabase
	      .from("design_versions")
	      .select(
	        "id, version_number, uploaded_by, submitted_by, created_at, status, notes, preview_file_id, doctor_response, approval_decided_at",
	      )
	      .eq("lab_id", labId)
	      .eq("case_id", caseId)
	      .order("version_number", { ascending: false })
	      .returns<DesignVersionRow[]>(),
	    supabase
	      .from("design_approvals")
	      .select("design_version_id, status, comment, decided_at, created_at")
	      .eq("lab_id", labId)
	      .eq("case_id", caseId)
	      .order("created_at", { ascending: false })
	      .returns<DesignApprovalRow[]>(),
	    supabase
	      .from("case_comments")
	      .select("id, author_id, body, visibility, file_id, created_at")
	      .eq("lab_id", labId)
	      .eq("case_id", caseId)
	      .order("created_at", { ascending: true })
	      .returns<CaseCommentRow[]>(),
	  ]);

	  const error =
	    caseError ??
	    stageError ??
	    timelineError ??
	    filesError ??
	    designError ??
	    approvalError ??
	    commentsError;

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
	      [
	        ...(files ?? []).map((file) => file.uploaded_by),
	        ...(designVersions ?? []).map(
	          (version) => version.uploaded_by ?? version.submitted_by,
	        ),
	        ...(comments ?? []).map((comment) => comment.author_id),
	        ...(timeline ?? []).map((event) => event.actor_id),
	      ]
	        .filter((id): id is string => Boolean(id)),
	    ),
	  );
	  const { data: uploaders, error: uploadersError } = uploaderIds.length
	    ? await supabase
		        .from("profiles")
		        .select("id, full_name, email, role")
		        .in("id", uploaderIds)
		        .returns<ProfileSummaryRow[]>()
	    : { data: [], error: null };

	  if (uploadersError) throw new Error(uploadersError.message);

	  const uploaderMap = new Map(
	    (uploaders ?? []).map((profile) => [
	      profile.id,
	      profile.full_name ?? profile.email ?? "Unknown user",
	    ]),
	  );
	  const profileMap = new Map((uploaders ?? []).map((profile) => [profile.id, profile]));
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
	  const designAccess: DesignAccessCase = {
	    doctorProfileId: accessCase.doctorProfileId,
	    assignedTechnicianId: accessCase.assignedTechnicianId,
	  };
	  const commentAccess: CommentAccessCase = {
	    doctorProfileId: accessCase.doctorProfileId,
	    assignedTechnicianId: accessCase.assignedTechnicianId,
	  };
	  const latestApprovalByDesign = new Map<string, DesignApprovalRow>();

	  for (const approval of designApprovals ?? []) {
	    if (!latestApprovalByDesign.has(approval.design_version_id)) {
	      latestApprovalByDesign.set(approval.design_version_id, approval);
	    }
	  }

	  const designItems = (designVersions ?? []).map((version) => {
	    const approval = latestApprovalByDesign.get(version.id);
	    const uploadedBy = version.uploaded_by ?? version.submitted_by;

	    return {
	      id: version.id,
	      versionNumber: Number(version.version_number),
	      uploadedBy,
	      uploadedByName: uploadedBy
	        ? uploaderMap.get(uploadedBy) ?? "Unknown user"
	        : "System",
	      uploadedAt: version.created_at,
	      status: version.status,
	      notes: version.notes,
	      previewFileId: version.preview_file_id,
	      files: visibleFiles.filter((file) => file.designVersionId === version.id),
	      doctorResponse: version.doctor_response,
	      approvalStatus: approval?.status ?? null,
	      approvalComment: approval?.comment ?? null,
	      approvalDecidedAt: version.approval_decided_at ?? approval?.decided_at ?? null,
	    } satisfies DesignVersionItem;
	  });
	  const fileNameMap = new Map(visibleFiles.map((file) => [file.id, file.fileName]));
	  const commentItems = (comments ?? [])
	    .filter((comment) =>
	      canViewCaseComment({
	        roles: session.roles,
	        userId: session.userId,
	        item: commentAccess,
	        visibility: comment.visibility,
	      }),
	    )
	    .map((comment) => {
	      const profile = comment.author_id ? profileMap.get(comment.author_id) : null;

	      return {
	        id: comment.id,
	        authorId: comment.author_id,
	        authorName:
	          profile?.full_name ?? profile?.email ?? (comment.author_id ? "Unknown user" : "System"),
	        authorRole: profile?.role ?? null,
	        body: comment.body,
	        visibility: comment.visibility,
	        fileId: comment.file_id,
	        fileName: comment.file_id ? fileNameMap.get(comment.file_id) ?? null : null,
	        createdAt: comment.created_at,
	      } satisfies CaseCommentItem;
	    });
	  const allowedCommentVisibilities = getAllowedCommentVisibilities({
	    roles: session.roles,
	    userId: session.userId,
	    item: commentAccess,
	  });

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
	    designVersions: designItems,
	    canUploadDesignVersion: canUploadDesignVersion({
	      roles: session.roles,
	      userId: session.userId,
	      item: designAccess,
	    }),
	    canDecideDesignVersion: canDecideDesignVersion({
	      roles: session.roles,
	      userId: session.userId,
	      item: designAccess,
	    }),
	    canCommentDesignVersion: canCommentOnDesignVersion({
	      roles: session.roles,
	      userId: session.userId,
	      item: designAccess,
	    }),
	    comments: commentItems,
	    canCreateComment: allowedCommentVisibilities.some((visibility) =>
	      canCreateCaseComment({
	        roles: session.roles,
	        userId: session.userId,
	        item: commentAccess,
	        visibility,
	      }),
	    ),
	    allowedCommentVisibilities,
    stageHistory: (stageLogs ?? []).map((item) => ({
      id: item.id,
      fromStage: item.from_stage,
      toStage: item.to_stage,
      notes: item.notes,
      createdAt: item.created_at,
    })),
	    timeline: (timeline ?? [])
	      .filter((item) => isTimelineEventType(item.event_type))
	      .map((item) => {
	        const profile = item.actor_id ? profileMap.get(item.actor_id) : null;

	        return {
	          id: item.id,
	          eventType: item.event_type as TimelineEventType,
	          title: item.title,
	          details: getTimelineDetails(item.metadata),
	          actorName:
	            profile?.full_name ??
	            profile?.email ??
	            (item.actor_id ? "Unknown user" : "System"),
	          actorRole: profile?.role ?? null,
	          createdAt: item.created_at,
	        };
	      }),
	  } satisfies CaseDetail;
}
