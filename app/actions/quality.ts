"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { stageLabels, type ProductionStage } from "@/lib/constants/workflow";
import type { AppRole } from "@/lib/constants/roles";
import { hasSupabaseEnv } from "@/lib/env";
import { hasPermission, hasRole } from "@/lib/permissions";
import {
  getPreviousProductionStage,
  getQcChecklistForWorkType,
  isQcResult,
  isRemakeResponsibility,
  type QcResult,
  type RemakeResponsibility,
} from "@/lib/quality/qc-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type QualityActionState = {
  ok: boolean;
  message: string;
};

const qualityCheckSchema = z.object({
  caseId: z.uuid(),
  result: z.string().refine(isQcResult, "Invalid QC result."),
  notes: z.string().max(1000).optional(),
});

const remakeSchema = z.object({
  caseId: z.uuid(),
  originalCaseId: z.uuid().optional().or(z.literal("")),
  reason: z.string().min(3).max(500),
  responsibility: z.string().refine(isRemakeResponsibility, "Select responsibility."),
  costImpact: z.coerce.number().min(0).max(999999).default(0),
  notes: z.string().max(1000).optional(),
});

type CaseQualityRow = {
  id: string;
  lab_id: string;
  case_number: string;
  work_type: string | null;
  restoration_type: string;
  current_stage: ProductionStage | null;
  stage: ProductionStage;
  assigned_technician_id: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function canManageQuality(roles: AppRole[]) {
  return (
    hasPermission(roles, "quality_check:create") ||
    hasRole(roles, ["super_admin", "lab_owner", "lab_manager"])
  );
}

function canManageRemakes(roles: AppRole[]) {
  return hasRole(roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "reception",
  ]);
}

async function getQualityCase(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, lab_id, case_number, work_type, restoration_type, current_stage, stage, assigned_technician_id",
    )
    .eq("lab_id", labId)
    .eq("id", caseId)
    .maybeSingle<CaseQualityRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Case was not found.");

  return data;
}

export async function submitQualityCheckAction(
  formData: FormData,
): Promise<QualityActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }
  const labId = session.activeLabId;
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase before saving QC records." };
  }
  if (!canManageQuality(session.roles)) {
    return { ok: false, message: "You are not allowed to submit quality checks." };
  }

  const parsed = qualityCheckSchema.safeParse({
    caseId: getString(formData, "caseId"),
    result: getString(formData, "result"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid QC form." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getQualityCase(parsed.data.caseId, labId);
    const currentStage = item.current_stage ?? item.stage;

    if (
      session.roles.includes("technician") &&
      !hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]) &&
      item.assigned_technician_id !== session.userId
    ) {
      return { ok: false, message: "Technicians can submit QC only for assigned cases." };
    }

    const checklist = getQcChecklistForWorkType(
      item.work_type ?? item.restoration_type,
    );
    const checklistState = Object.fromEntries(
      checklist.map((entry) => [entry.key, formData.get(entry.key) === "on"]),
    ) as Record<string, boolean>;
    const failedItems = checklist.filter((entry) => !checklistState[entry.key]);
    const result = parsed.data.result as QcResult;
    const notes = parsed.data.notes || null;

    if ((result === "failed" || result === "needs_adjustment") && !notes) {
      return {
        ok: false,
        message: "A reason is required when QC fails or needs adjustment.",
      };
    }
    if (result === "passed" && failedItems.length > 0) {
      return {
        ok: false,
        message: "All QC checklist items must be checked before final approval.",
      };
    }

    const now = new Date().toISOString();
    const previousStage = getPreviousProductionStage(currentStage);
    const { data: check, error: checkError } = await supabase
      .from("quality_checks")
      .insert({
        lab_id: labId,
        case_id: item.id,
        checked_by: session.userId,
        passed: result === "passed",
        result,
        checklist: checklistState as Json,
        previous_stage: previousStage,
        completed_at: now,
        notes,
      })
      .select("id")
      .single<{ id: string }>();

    if (checkError) throw new Error(checkError.message);

    const { error: itemError } = await supabase.from("quality_check_items").insert(
      checklist.map((entry) => ({
        lab_id: labId,
        quality_check_id: check.id,
        label: entry.label,
        result: checklistState[entry.key] ? "passed" : "failed",
        notes: checklistState[entry.key] ? null : notes,
      })),
    );

    if (itemError) throw new Error(itemError.message);

    const targetStage =
      result === "passed"
        ? "ready_for_delivery"
        : result === "needs_adjustment"
          ? previousStage
          : currentStage;
    const nextStatus = result === "failed" ? "on_hold" : "active";

    const { error: caseError } = await supabase
      .from("cases")
      .update({
        current_stage: targetStage,
        stage: targetStage,
        status: nextStatus,
        updated_at: now,
      })
      .eq("lab_id", labId)
      .eq("id", item.id);

    if (caseError) throw new Error(caseError.message);

    if (targetStage !== currentStage) {
      const { error: logError } = await supabase.from("case_stage_logs").insert({
        lab_id: labId,
        case_id: item.id,
        from_stage: currentStage,
        to_stage: targetStage,
        changed_by: session.userId,
        moved_by: session.userId,
        started_at: now,
        completed_at: now,
        notes:
          result === "passed"
            ? "QC passed and case moved to ready for delivery."
            : `QC needs adjustment. Returned to ${stageLabels[targetStage]}.`,
      });

      if (logError) throw new Error(logError.message);
    }

    const { error: timelineError } = await supabase.from("case_timeline").insert({
      lab_id: labId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "qc_recorded",
      title:
        result === "passed"
          ? "Quality control passed"
          : result === "needs_adjustment"
            ? "Quality control needs adjustment"
            : "Quality control failed",
      metadata: {
        result,
        failed_items: failedItems.map((entry) => entry.label),
        notes,
        to_stage: targetStage,
      },
    });

    if (timelineError) throw new Error(timelineError.message);

    revalidatePath("/quality-control");
    revalidatePath("/production");
    revalidatePath(`/cases/${item.id}`);

    return { ok: true, message: "Quality check saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "QC save failed.",
    };
  }
}

export async function createRemakeAction(
  formData: FormData,
): Promise<QualityActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }
  const labId = session.activeLabId;
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase before saving remake records." };
  }
  if (!canManageRemakes(session.roles)) {
    return { ok: false, message: "You are not allowed to create remake records." };
  }

  const parsed = remakeSchema.safeParse({
    caseId: getString(formData, "caseId"),
    originalCaseId: getString(formData, "originalCaseId"),
    reason: getString(formData, "reason"),
    responsibility: getString(formData, "responsibility"),
    costImpact: getString(formData, "costImpact") || "0",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid remake form.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getQualityCase(parsed.data.caseId, labId);
    const responsibility = parsed.data.responsibility as RemakeResponsibility;
    const photoFileIds = formData
      .getAll("photoFileIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    const { error: insertError } = await supabase.from("remakes").insert({
      lab_id: labId,
      case_id: item.id,
      original_case_id: parsed.data.originalCaseId || null,
      reason: parsed.data.reason,
      responsibility,
      cost_impact: parsed.data.costImpact,
      notes: parsed.data.notes || null,
      photo_file_ids: photoFileIds as Json,
      created_by: session.userId,
    });

    if (insertError) throw new Error(insertError.message);

    const { error: caseError } = await supabase
      .from("cases")
      .update({ is_remake: true, updated_at: new Date().toISOString() })
      .eq("lab_id", labId)
      .eq("id", item.id);

    if (caseError) throw new Error(caseError.message);

    const { error: timelineError } = await supabase.from("case_timeline").insert({
      lab_id: labId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "remake_created",
      title: "Remake record created",
      metadata: {
        reason: parsed.data.reason,
        responsibility,
        cost_impact: parsed.data.costImpact,
      },
    });

    if (timelineError) throw new Error(timelineError.message);

    revalidatePath("/remakes");
    revalidatePath(`/cases/${item.id}`);

    return { ok: true, message: "Remake record created." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Remake save failed.",
    };
  }
}
