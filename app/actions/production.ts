"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { productionStages, stageLabels, type ProductionStage } from "@/lib/constants/workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canManageProductionBoard,
  getTransitionError,
  kanbanStages,
  transitionTitle,
} from "@/lib/production/stage-rules";

export type ProductionActionState = {
  ok: boolean;
  message: string;
};

const moveStageSchema = z.object({
  caseId: z.uuid(),
  targetStage: z.enum(productionStages),
  delayReason: z.string().max(500).optional(),
});

const assignTechnicianSchema = z.object({
  caseId: z.uuid(),
  technicianId: z.uuid(),
});

const caseOnlySchema = z.object({
  caseId: z.uuid(),
  delayReason: z.string().max(500).optional(),
});

const problemSchema = z.object({
  caseId: z.uuid(),
  problem: z.string().min(4).max(500),
});

type CaseWorkflowRow = {
  id: string;
  lab_id: string;
  case_number: string;
  current_stage: ProductionStage | null;
  stage: ProductionStage;
  due_date: string | null;
  status: string | null;
  missing_info_status: string | null;
  assigned_technician_id: string | null;
  requires_doctor_approval: boolean | null;
};

type TechnicianRow = {
  id: string;
  profile_id: string | null;
  display_name: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function nextKanbanStage(currentStage: ProductionStage) {
  const index = kanbanStages.indexOf(currentStage);

  return kanbanStages[Math.min(index + 1, kanbanStages.length - 1)];
}

async function getWorkflowCase(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, lab_id, case_number, current_stage, stage, due_date, status, missing_info_status, assigned_technician_id, requires_doctor_approval",
    )
    .eq("lab_id", labId)
    .eq("id", caseId)
    .maybeSingle<CaseWorkflowRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Case was not found.");

  return data;
}

async function hasApprovedDesign(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select("id")
    .eq("lab_id", labId)
    .eq("case_id", caseId)
    .eq("status", "approved")
    .limit(1);

  if (error) throw new Error(error.message);

  return Boolean(data?.length);
}

async function hasPassedQc(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quality_checks")
    .select("id")
    .eq("lab_id", labId)
    .eq("case_id", caseId)
    .eq("result", "passed")
    .limit(1);

  if (error) throw new Error(error.message);

  return Boolean(data?.length);
}

async function ensureStageTask(params: {
  labId: string;
  caseId: string;
  technicianProfileId: string | null;
  stage: ProductionStage;
  status: "queued" | "in_progress" | "done" | "blocked";
  actorId: string;
}) {
  if (!params.technicianProfileId) return;

  const supabase = await createSupabaseServerClient();
  const { data: technician, error } = await supabase
    .from("technicians")
    .select("id")
    .eq("lab_id", params.labId)
    .eq("profile_id", params.technicianProfileId)
    .maybeSingle<{ id: string }>();

  if (error) throw new Error(error.message);
  if (!technician) return;

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id")
    .eq("lab_id", params.labId)
    .eq("case_id", params.caseId)
    .eq("stage", params.stage)
    .eq("technician_id", technician.id)
    .maybeSingle<{ id: string }>();

  if (existingError) throw new Error(existingError.message);

  const now = new Date().toISOString();
  const patch = {
    status: params.status,
    started_at: params.status === "in_progress" ? now : undefined,
    completed_at: params.status === "done" ? now : undefined,
    updated_at: now,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", existing.id);

    if (updateError) throw new Error(updateError.message);
    return;
  }

  const { error: insertError } = await supabase.from("tasks").insert({
    lab_id: params.labId,
    case_id: params.caseId,
    technician_id: technician.id,
    stage: params.stage,
    title: `${stageLabels[params.stage]} work`,
    status: params.status,
    started_at: params.status === "in_progress" ? now : null,
    completed_at: params.status === "done" ? now : null,
    created_by: params.actorId,
  });

  if (insertError) throw new Error(insertError.message);
}

export async function moveCaseStageAction(
  formData: FormData,
): Promise<ProductionActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = moveStageSchema.safeParse({
    caseId: getString(formData, "caseId"),
    targetStage: getString(formData, "targetStage"),
    delayReason: getString(formData, "delayReason"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid move." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getWorkflowCase(parsed.data.caseId, session.activeLabId);
    const currentStage = item.current_stage ?? item.stage;
    const qcPassed = await hasPassedQc(item.id, item.lab_id);
    const transitionError = getTransitionError({
      roles: session.roles,
      currentStage,
      targetStage: parsed.data.targetStage,
      missingInfoStatus: item.missing_info_status ?? "complete",
      assignedTechnicianId: item.assigned_technician_id,
      currentUserId: session.userId,
      hasPassedQc: qcPassed,
      delayReason: parsed.data.delayReason,
      dueDate: item.due_date,
    });

	    if (transitionError) return { ok: false, message: transitionError };

	    if (
	      parsed.data.targetStage === "milling_printing" &&
	      item.requires_doctor_approval &&
	      !(await hasApprovedDesign(item.id, item.lab_id))
	    ) {
	      return {
	        ok: false,
	        message: "Doctor approval is required before milling or printing.",
	      };
	    }

    const now = new Date().toISOString();
    const nextStatus =
      parsed.data.targetStage === "waiting_doctor_info"
        ? "waiting_doctor_info"
        : "active";

    const { error: updateError } = await supabase
      .from("cases")
      .update({
        current_stage: parsed.data.targetStage,
        stage: parsed.data.targetStage,
        status: nextStatus,
        updated_at: now,
      })
      .eq("lab_id", session.activeLabId)
      .eq("id", item.id);

    if (updateError) throw new Error(updateError.message);

    const { error: logError } = await supabase.from("case_stage_logs").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      from_stage: currentStage,
      to_stage: parsed.data.targetStage,
      changed_by: session.userId,
      moved_by: session.userId,
      started_at: now,
      completed_at: now,
      delay_reason: parsed.data.delayReason || null,
      notes: parsed.data.delayReason || transitionTitle(currentStage, parsed.data.targetStage),
    });

    if (logError) throw new Error(logError.message);

    await ensureStageTask({
      labId: session.activeLabId,
      caseId: item.id,
      technicianProfileId: item.assigned_technician_id,
      stage: currentStage,
      status: "done",
      actorId: session.userId,
    });
    await ensureStageTask({
      labId: session.activeLabId,
      caseId: item.id,
      technicianProfileId: item.assigned_technician_id,
      stage: parsed.data.targetStage,
      status: "queued",
      actorId: session.userId,
    });

    const { error: timelineError } = await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "stage_changed",
      title: transitionTitle(currentStage, parsed.data.targetStage),
      metadata: {
        from_stage: currentStage,
        to_stage: parsed.data.targetStage,
        delay_reason: parsed.data.delayReason || null,
      },
    });

    if (timelineError) throw new Error(timelineError.message);

    revalidatePath("/production");
    revalidatePath("/technicians/workspace");
    revalidatePath(`/cases/${item.id}`);

    return { ok: true, message: "Case stage updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Stage update failed.",
    };
  }
}

export async function assignTechnicianAction(
  formData: FormData,
): Promise<ProductionActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  if (!canManageProductionBoard(session.roles)) {
    return { ok: false, message: "Only production managers can assign technicians." };
  }

  const parsed = assignTechnicianSchema.safeParse({
    caseId: getString(formData, "caseId"),
    technicianId: getString(formData, "technicianId"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid assignment." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [item, { data: technician, error: technicianError }] = await Promise.all([
      getWorkflowCase(parsed.data.caseId, session.activeLabId),
      supabase
        .from("technicians")
        .select("id, profile_id, display_name")
        .eq("lab_id", session.activeLabId)
        .eq("id", parsed.data.technicianId)
        .maybeSingle<TechnicianRow>(),
    ]);

    if (technicianError) throw new Error(technicianError.message);
    if (!technician) {
      return { ok: false, message: "Technician not found." };
    }
    if (!technician.profile_id) {
      return {
        ok: false,
        message: `${technician.display_name} does not have a portal account yet. Open their edit page, scroll to "Portal account", and link a Supabase user UID first.`,
      };
    }

    const { error: updateError } = await supabase
      .from("cases")
      .update({
        assigned_technician_id: technician.profile_id,
        updated_at: new Date().toISOString(),
      })
      .eq("lab_id", session.activeLabId)
      .eq("id", item.id);

    if (updateError) throw new Error(updateError.message);

    await ensureStageTask({
      labId: session.activeLabId,
      caseId: item.id,
      technicianProfileId: technician.profile_id,
      stage: item.current_stage ?? item.stage,
      status: "queued",
      actorId: session.userId,
    });

    const { error: timelineError } = await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "updated",
      title: `${technician.display_name} assigned to production.`,
      metadata: {
        technician_id: technician.id,
        technician_profile_id: technician.profile_id,
      },
    });

    if (timelineError) throw new Error(timelineError.message);

    revalidatePath("/production");
    revalidatePath("/technicians/workspace");
    revalidatePath(`/cases/${item.id}`);

    return { ok: true, message: "Technician assigned." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Assignment failed.",
    };
  }
}

export async function startStageAction(
  formData: FormData,
): Promise<ProductionActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = caseOnlySchema.safeParse({
    caseId: getString(formData, "caseId"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid case." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getWorkflowCase(parsed.data.caseId, session.activeLabId);
    const currentStage = item.current_stage ?? item.stage;

    if (item.assigned_technician_id !== session.userId) {
      return { ok: false, message: "Only the assigned technician can start this stage." };
    }

    if (currentStage === "waiting_doctor_info") {
      return { ok: false, message: "This case is waiting for doctor information." };
    }

    await ensureStageTask({
      labId: session.activeLabId,
      caseId: item.id,
      technicianProfileId: session.userId,
      stage: currentStage,
      status: "in_progress",
      actorId: session.userId,
    });

    const { error: timelineError } = await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "updated",
      title: `${stageLabels[currentStage]} started.`,
      metadata: { stage: currentStage },
    });

    if (timelineError) throw new Error(timelineError.message);

    revalidatePath("/technicians/workspace");
    revalidatePath("/production");

    return { ok: true, message: "Stage started." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not start stage.",
    };
  }
}

export async function completeStageAction(
  formData: FormData,
): Promise<ProductionActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = caseOnlySchema.safeParse({
    caseId: getString(formData, "caseId"),
    delayReason: getString(formData, "delayReason"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid completion request." };
  }

  const item = await getWorkflowCase(parsed.data.caseId, session.activeLabId);
  const currentStage = item.current_stage ?? item.stage;
  const targetStage = nextKanbanStage(currentStage);
  const data = new FormData();
  data.set("caseId", item.id);
  data.set("targetStage", targetStage);
  data.set("delayReason", parsed.data.delayReason ?? "");

  return moveCaseStageAction(data);
}

export async function addProductionProblemAction(
  formData: FormData,
): Promise<ProductionActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = problemSchema.safeParse({
    caseId: getString(formData, "caseId"),
    problem: getString(formData, "problem"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid problem." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const item = await getWorkflowCase(parsed.data.caseId, session.activeLabId);
    const currentStage = item.current_stage ?? item.stage;

    if (
      item.assigned_technician_id !== session.userId &&
      !canManageProductionBoard(session.roles)
    ) {
      return { ok: false, message: "You cannot report a problem on this case." };
    }

    await ensureStageTask({
      labId: session.activeLabId,
      caseId: item.id,
      technicianProfileId: item.assigned_technician_id,
      stage: currentStage,
      status: "blocked",
      actorId: session.userId,
    });

    const { error } = await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      actor_id: session.userId,
      event_type: "updated",
      title: "Production problem reported.",
      metadata: {
        stage: currentStage,
        problem: parsed.data.problem,
      },
    });

    if (error) throw new Error(error.message);

    revalidatePath("/technicians/workspace");
    revalidatePath("/production");
    revalidatePath(`/cases/${item.id}`);

    return { ok: true, message: "Problem recorded." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not record problem.",
    };
  }
}
