"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { stageLabels, type ProductionStage } from "@/lib/constants/workflow";
import {
  canCommentOnDesignVersion,
  canDecideDesignVersion,
  canUploadDesignVersion,
  type DesignAccessCase,
  type DesignStatus,
} from "@/lib/design/design-workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type DesignActionState = {
  ok: boolean;
  message: string;
  designVersionId?: string;
  versionNumber?: number;
};

const createDesignVersionSchema = z.object({
  caseId: z.uuid(),
  notes: z.string().max(1200).optional(),
});

const previewSchema = z.object({
  designVersionId: z.uuid(),
  fileId: z.uuid(),
});

const decisionSchema = z.object({
  designVersionId: z.uuid(),
  decision: z.enum(["approved", "needs_changes", "rejected", "comment"]),
  comment: z.string().max(1200).optional(),
});

type DesignCaseRow = {
  id: string;
  lab_id: string;
  case_number: string;
  doctor_id: string;
  assigned_technician_id: string | null;
  current_stage: ProductionStage | null;
  stage: ProductionStage;
  requires_doctor_approval: boolean | null;
  doctors: { profile_id: string | null } | null;
};

type DesignVersionRow = {
  id: string;
  lab_id: string;
  case_id: string;
  version_number: number;
  status: DesignStatus;
  doctor_id?: string;
  cases: DesignCaseRow;
};

function toDesignAccess(row: DesignCaseRow): DesignAccessCase {
  return {
    doctorProfileId: row.doctors?.profile_id ?? null,
    assignedTechnicianId: row.assigned_technician_id,
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getCaseForDesign(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, lab_id, case_number, doctor_id, assigned_technician_id, current_stage, stage, requires_doctor_approval, doctors(profile_id)",
    )
    .eq("lab_id", labId)
    .eq("id", caseId)
    .maybeSingle<DesignCaseRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Case was not found.");

  return data;
}

async function getDesignVersionForDecision(designVersionId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select(
      "id, lab_id, case_id, version_number, status, cases(id, lab_id, case_number, doctor_id, assigned_technician_id, current_stage, stage, requires_doctor_approval, doctors(profile_id))",
    )
    .eq("lab_id", labId)
    .eq("id", designVersionId)
    .maybeSingle<DesignVersionRow>();

  if (error) throw new Error(error.message);
  if (!data || !data.cases) throw new Error("Design version was not found.");

  return data;
}

async function addStageLog(params: {
  labId: string;
  caseId: string;
  actorId: string;
  fromStage: ProductionStage;
  toStage: ProductionStage;
  notes: string;
}) {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("case_stage_logs").insert({
    lab_id: params.labId,
    case_id: params.caseId,
    from_stage: params.fromStage,
    to_stage: params.toStage,
    changed_by: params.actorId,
    moved_by: params.actorId,
    started_at: now,
    completed_at: now,
    notes: params.notes,
  });

  if (error) throw new Error(error.message);
}

async function addTimeline(params: {
  labId: string;
  caseId: string;
  actorId: string;
  eventType?: "design_submitted" | "approval_updated";
  title: string;
  metadata: Record<string, Json | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("case_timeline").insert({
    lab_id: params.labId,
    case_id: params.caseId,
    actor_id: params.actorId,
    event_type: params.eventType ?? "design_submitted",
    title: params.title,
    metadata: params.metadata,
  });

  if (error) throw new Error(error.message);
}

export async function createDesignVersionAction(
  input: unknown,
): Promise<DesignActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = createDesignVersionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid design version." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getCaseForDesign(parsed.data.caseId, session.activeLabId);

    if (
      !canUploadDesignVersion({
        roles: session.roles,
        userId: session.userId,
        item: toDesignAccess(item),
      })
    ) {
      return { ok: false, message: "You cannot upload design versions for this case." };
    }

    const { data: latestVersions, error: latestError } = await supabase
      .from("design_versions")
      .select("version_number")
      .eq("lab_id", session.activeLabId)
      .eq("case_id", item.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .returns<Array<{ version_number: number }>>();

    if (latestError) throw new Error(latestError.message);

    const versionNumber = Number(latestVersions?.[0]?.version_number ?? 0) + 1;
    const { data: designVersion, error: insertError } = await supabase
      .from("design_versions")
      .insert({
        lab_id: session.activeLabId,
        case_id: item.id,
        version_no: versionNumber,
        version_number: versionNumber,
        notes: parsed.data.notes || null,
        submitted_by: session.userId,
        uploaded_by: session.userId,
        status: "pending_review",
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError) throw new Error(insertError.message);

    const nextStage: ProductionStage = item.requires_doctor_approval
      ? "doctor_approval"
      : "design_review";
    const currentStage = item.current_stage ?? item.stage;

    if (currentStage !== nextStage) {
      const { error: updateError } = await supabase
        .from("cases")
        .update({
          current_stage: nextStage,
          stage: nextStage,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("lab_id", session.activeLabId)
        .eq("id", item.id);

      if (updateError) throw new Error(updateError.message);

      await addStageLog({
        labId: session.activeLabId,
        caseId: item.id,
        actorId: session.userId,
        fromStage: currentStage,
        toStage: nextStage,
        notes: `Design V${versionNumber} submitted for ${stageLabels[nextStage]}.`,
      });
    }

    await addTimeline({
      labId: session.activeLabId,
      caseId: item.id,
      actorId: session.userId,
      title: `Design V${versionNumber} uploaded for review.`,
      metadata: {
        design_version_id: designVersion.id,
        version_number: versionNumber,
        status: "pending_review",
      },
    });

    revalidatePath(`/cases/${item.id}`);
    revalidatePath("/production");
    revalidatePath("/technicians/workspace");

    return {
      ok: true,
      message: `Design V${versionNumber} created.`,
      designVersionId: designVersion.id,
      versionNumber,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Design version creation failed.",
    };
  }
}

export async function setDesignPreviewAction(
  input: unknown,
): Promise<DesignActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = previewSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Invalid preview file." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const design = await getDesignVersionForDecision(
      parsed.data.designVersionId,
      session.activeLabId,
    );

    if (
      !canUploadDesignVersion({
        roles: session.roles,
        userId: session.userId,
        item: toDesignAccess(design.cases),
      })
    ) {
      return { ok: false, message: "You cannot update this preview." };
    }

    const { data: file, error: fileError } = await supabase
      .from("case_files")
      .select("id, design_version_id")
      .eq("lab_id", session.activeLabId)
      .eq("case_id", design.case_id)
      .eq("id", parsed.data.fileId)
      .maybeSingle<{ id: string; design_version_id: string | null }>();

    if (fileError) throw new Error(fileError.message);
    if (!file || file.design_version_id !== design.id) {
      return { ok: false, message: "Preview file is not linked to this design version." };
    }

    const { error } = await supabase
      .from("design_versions")
      .update({
        preview_file_id: parsed.data.fileId,
        updated_at: new Date().toISOString(),
      })
      .eq("lab_id", session.activeLabId)
      .eq("id", design.id);

    if (error) throw new Error(error.message);

    revalidatePath(`/cases/${design.case_id}`);

    return { ok: true, message: "Preview screenshot linked." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Preview update failed.",
    };
  }
}

export async function decideDesignVersionAction(
  formData: FormData,
): Promise<DesignActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = decisionSchema.safeParse({
    designVersionId: getString(formData, "designVersionId"),
    decision: getString(formData, "decision"),
    comment: getString(formData, "comment"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid design action." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const design = await getDesignVersionForDecision(
      parsed.data.designVersionId,
      session.activeLabId,
    );
    const item = design.cases;
    const access = toDesignAccess(item);
    const canDecide = canDecideDesignVersion({
      roles: session.roles,
      userId: session.userId,
      item: access,
    });
    const canComment = canCommentOnDesignVersion({
      roles: session.roles,
      userId: session.userId,
      item: access,
    });

    if (parsed.data.decision === "comment" && !canComment) {
      return { ok: false, message: "You cannot comment on this design." };
    }

    if (parsed.data.decision !== "comment" && !canDecide) {
      return { ok: false, message: "You cannot approve or reject this design." };
    }

    if (
      ["needs_changes", "rejected"].includes(parsed.data.decision) &&
      !parsed.data.comment?.trim()
    ) {
      return { ok: false, message: "A reason is required." };
    }

    const now = new Date().toISOString();
    const approvalStatus =
      parsed.data.decision === "needs_changes"
        ? "changes_requested"
        : parsed.data.decision === "comment"
          ? "pending"
          : parsed.data.decision;

    const { error: approvalError } = await supabase.from("design_approvals").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      design_version_id: design.id,
      doctor_id: item.doctor_id,
      status: approvalStatus,
      comment: parsed.data.comment || null,
      decided_at: parsed.data.decision === "comment" ? null : now,
    });

    if (approvalError) throw new Error(approvalError.message);

    if (parsed.data.decision !== "comment") {
      const { error: designError } = await supabase
        .from("design_versions")
        .update({
          status: parsed.data.decision,
          doctor_response: parsed.data.comment || null,
          approval_decided_at: now,
          updated_at: now,
        })
        .eq("lab_id", session.activeLabId)
        .eq("id", design.id);

      if (designError) throw new Error(designError.message);
    }

    if (parsed.data.decision === "approved") {
      const fromStage = item.current_stage ?? item.stage;
      const toStage: ProductionStage = "milling_printing";
      const { error: caseError } = await supabase
        .from("cases")
        .update({
          current_stage: toStage,
          stage: toStage,
          status: "active",
          updated_at: now,
        })
        .eq("lab_id", session.activeLabId)
        .eq("id", item.id);

      if (caseError) throw new Error(caseError.message);

      if (fromStage !== toStage) {
        await addStageLog({
          labId: session.activeLabId,
          caseId: item.id,
          actorId: session.userId,
          fromStage,
          toStage,
          notes: `Design V${design.version_number} approved.`,
        });
      }
    }

    if (["needs_changes", "rejected"].includes(parsed.data.decision)) {
      const fromStage = item.current_stage ?? item.stage;
      const toStage: ProductionStage = "cad_design";
      const { error: caseError } = await supabase
        .from("cases")
        .update({
          current_stage: toStage,
          stage: toStage,
          status: "active",
          updated_at: now,
        })
        .eq("lab_id", session.activeLabId)
        .eq("id", item.id);

      if (caseError) throw new Error(caseError.message);

      if (fromStage !== toStage) {
        await addStageLog({
          labId: session.activeLabId,
          caseId: item.id,
          actorId: session.userId,
          fromStage,
          toStage,
          notes:
            parsed.data.decision === "needs_changes"
              ? `Design V${design.version_number} needs changes.`
              : `Design V${design.version_number} rejected.`,
        });
      }

      if (item.assigned_technician_id) {
        await supabase.from("notifications").insert({
          lab_id: session.activeLabId,
          recipient_id: item.assigned_technician_id,
          case_id: item.id,
          title:
            parsed.data.decision === "needs_changes"
              ? "Design changes requested"
              : "Design rejected",
          body: parsed.data.comment || null,
          metadata: {
            design_version_id: design.id,
            version_number: design.version_number,
          },
        });
      }
    }

    const titleMap = {
      approved: `Design V${design.version_number} approved.`,
      needs_changes: `Changes requested for design V${design.version_number}.`,
      rejected: `Design V${design.version_number} rejected.`,
      comment: `Comment added to design V${design.version_number}.`,
    };

    await addTimeline({
      labId: session.activeLabId,
      caseId: item.id,
      actorId: session.userId,
      eventType: "approval_updated",
      title: titleMap[parsed.data.decision],
      metadata: {
        design_version_id: design.id,
        version_number: design.version_number,
        decision: parsed.data.decision,
        comment: parsed.data.comment || null,
      },
    });

    revalidatePath(`/cases/${item.id}`);
    revalidatePath("/production");
    revalidatePath("/technicians/workspace");

    return { ok: true, message: titleMap[parsed.data.decision] };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Design action failed.",
    };
  }
}
