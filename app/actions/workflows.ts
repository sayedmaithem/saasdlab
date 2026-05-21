"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole } from "@/lib/permissions";
import { productionStages, stageLabels } from "@/lib/constants/workflow";

export type WorkflowActionResult = { ok: boolean; message: string; id?: string };

// ── Schemas ───────────────────────────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  is_default: z.boolean().default(false),
});

const updateTemplateSchema = createTemplateSchema.extend({
  id: z.string().uuid(),
});

const createStageSchema = z.object({
  workflow_id: z.string().uuid(),
  stage_key: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  color: z.string().max(30).optional(),
  icon: z.string().max(50).optional(),
  requires_technician: z.boolean().default(false),
  requires_qc: z.boolean().default(false),
  requires_doctor_approval: z.boolean().default(false),
  blocks_delivery: z.boolean().default(false),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireWorkflowManager() {
  const session = await requireAuth();
  const labId = session.activeLabId;

  if (!labId) throw new Error("No active lab.");

  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    throw new Error("Insufficient permissions to manage workflows.");
  }

  const supabase = await createSupabaseServerClient();
  return { session, labId, supabase };
}

// ── Template actions ──────────────────────────────────────────────────────────

export async function createWorkflowTemplateAction(
  formData: FormData,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    const parsed = createTemplateSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      is_default: formData.get("is_default") === "on",
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const payload = { ...parsed.data, lab_id: labId };

    // If setting as default, clear any existing default first
    if (payload.is_default) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("lab_workflow_templates")
        .update({ is_default: false })
        .eq("lab_id", labId)
        .eq("is_default", true);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("lab_workflow_templates")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Workflow template created.", id: (data as { id: string }).id };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function updateWorkflowTemplateAction(
  formData: FormData,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    const parsed = updateTemplateSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      is_default: formData.get("is_default") === "on",
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { id, ...rest } = parsed.data;

    // Verify template belongs to this lab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("lab_workflow_templates")
      .select("id")
      .eq("id", id)
      .eq("lab_id", labId)
      .single();

    if (!existing) return { ok: false, message: "Template not found." };

    if (rest.is_default) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("lab_workflow_templates")
        .update({ is_default: false })
        .eq("lab_id", labId)
        .eq("is_default", true)
        .neq("id", id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("lab_workflow_templates")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Template updated." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function deleteWorkflowTemplateAction(
  templateId: string,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("lab_workflow_templates")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", templateId)
      .eq("lab_id", labId);

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Workflow template deactivated." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// ── Stage actions ─────────────────────────────────────────────────────────────

export async function createWorkflowStageAction(
  formData: FormData,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    const parsed = createStageSchema.safeParse({
      workflow_id: formData.get("workflow_id"),
      stage_key: formData.get("stage_key"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      sort_order: formData.get("sort_order"),
      color: formData.get("color") || undefined,
      icon: formData.get("icon") || undefined,
      requires_technician: formData.get("requires_technician") === "on",
      requires_qc: formData.get("requires_qc") === "on",
      requires_doctor_approval: formData.get("requires_doctor_approval") === "on",
      blocks_delivery: formData.get("blocks_delivery") === "on",
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("lab_workflow_stages")
      .insert({ ...parsed.data, lab_id: labId })
      .select("id")
      .single();

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Stage added.", id: (data as { id: string }).id };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function deleteWorkflowStageAction(
  stageId: string,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("lab_workflow_stages")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", stageId)
      .eq("lab_id", labId);

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Stage removed." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// ── Seed Default Workflow ─────────────────────────────────────────────────────

/**
 * Idempotent default workflow seeder.
 *
 * Creates a "Standard Lab Workflow" template with all 18 production stages
 * and linear forward transitions. Safe to call multiple times — exits early
 * if the lab already has an active workflow template.
 *
 * This is the one-click pilot bootstrap action.
 */
export async function seedDefaultWorkflowAction(): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();
    const sb = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Idempotency check — skip if any active template already exists
    const { count: existingCount } = await sb
      .from("lab_workflow_templates")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true);

    if (existingCount && existingCount > 0) {
      return {
        ok: false,
        message: "A workflow template already exists for this lab. No changes were made.",
      };
    }

    // 1. Create the template
    const { data: tplData, error: tplErr } = await sb
      .from("lab_workflow_templates")
      .insert({
        lab_id: labId,
        name: "Standard Lab Workflow",
        description: "Default 18-stage workflow for dental lab production. Matches the fixed enum used by the production board.",
        is_default: true,
        is_active: true,
      })
      .select("id")
      .single();

    if (tplErr) return { ok: false, message: tplErr.message };
    const templateId = (tplData as { id: string }).id;

    // Stage-level gate flags — sensible defaults for a dental lab
    const gateFlags: Record<string, {
      requires_technician?: boolean;
      requires_qc?: boolean;
      requires_doctor_approval?: boolean;
      blocks_delivery?: boolean;
    }> = {
      cad_design: { requires_technician: true },
      milling_printing: { requires_technician: true, requires_doctor_approval: true },
      quality_control: { requires_technician: true, requires_qc: true },
      ready_for_delivery: { blocks_delivery: false },
    };

    // 2. Seed all 18 stages
    const stageRows = productionStages.map((key, idx) => ({
      lab_id: labId,
      workflow_id: templateId,
      stage_key: key,
      name: stageLabels[key],
      sort_order: idx,
      is_active: true,
      requires_technician: gateFlags[key]?.requires_technician ?? false,
      requires_qc: gateFlags[key]?.requires_qc ?? false,
      requires_doctor_approval: gateFlags[key]?.requires_doctor_approval ?? false,
      blocks_delivery: gateFlags[key]?.blocks_delivery ?? false,
    }));

    const { error: stagesErr } = await sb
      .from("lab_workflow_stages")
      .insert(stageRows);

    if (stagesErr) {
      // Rollback the template on failure
      await sb.from("lab_workflow_templates").update({ is_active: false }).eq("id", templateId);
      return { ok: false, message: `Failed to seed stages: ${stagesErr.message}` };
    }

    // 3. Seed linear forward transitions
    // The standard production flow is linear: each stage → the next stage.
    // Special stages on_hold and cancelled are excluded from the main chain.
    const linearStages = productionStages.filter(
      (s) => s !== "on_hold" && s !== "cancelled",
    );

    const transitionRows: Array<{
      lab_id: string;
      workflow_id: string;
      from_stage_key: string;
      to_stage_key: string;
      allowed_roles: string[];
      requires_note: boolean;
      is_active: boolean;
    }> = [];

    for (let i = 0; i < linearStages.length - 1; i++) {
      transitionRows.push({
        lab_id: labId,
        workflow_id: templateId,
        from_stage_key: linearStages[i]!,
        to_stage_key: linearStages[i + 1]!,
        allowed_roles: [], // empty = all lab members permitted
        requires_note: false,
        is_active: true,
      });
    }

    // Wildcard catch-all → on_hold (any stage can be put on hold)
    transitionRows.push({
      lab_id: labId,
      workflow_id: templateId,
      from_stage_key: "*",
      to_stage_key: "on_hold",
      allowed_roles: [], // managers + tech
      requires_note: true, // require a reason when putting on hold
      is_active: true,
    });

    // on_hold → received (re-enter workflow from hold)
    transitionRows.push({
      lab_id: labId,
      workflow_id: templateId,
      from_stage_key: "on_hold",
      to_stage_key: "received",
      allowed_roles: [], // managers only in practice (getTransitionError handles this)
      requires_note: false,
      is_active: true,
    });

    // Wildcard → cancelled (any stage can be cancelled by a manager)
    transitionRows.push({
      lab_id: labId,
      workflow_id: templateId,
      from_stage_key: "*",
      to_stage_key: "cancelled",
      allowed_roles: [],
      requires_note: true,
      is_active: true,
    });

    const { error: transitionsErr } = await sb
      .from("workflow_transitions")
      .insert(transitionRows);

    if (transitionsErr) {
      // Non-fatal: template and stages are seeded; transitions failed
      return {
        ok: true,
        message: `Workflow and stages created. Transitions could not be seeded: ${transitionsErr.message}. You can add transitions manually.`,
      };
    }

    revalidatePath("/command-center/master-data/workflows");
    revalidatePath("/owner");
    return {
      ok: true,
      message: `Standard Lab Workflow created with ${linearStages.length - 1} transitions. The production board is now in custom workflow mode.`,
    };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// ── Stage Requirements Actions ────────────────────────────────────────────────

const stageRequirementsSchema = z.object({
  workflow_id: z.string().uuid(),
  stage_key: z.string().min(1).max(80),
  requires_files: z.boolean().default(false),
  requires_price: z.boolean().default(false),
  requires_assigned_technician: z.boolean().default(false),
  requires_qc_pass: z.boolean().default(false),
  requires_doctor_approval: z.boolean().default(false),
});

/**
 * Upsert a stage_requirements row for (workflow_id, stage_key).
 * Uses ON CONFLICT UPDATE so it is safe to call multiple times.
 */
export async function upsertStageRequirementsAction(
  formData: FormData,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    const parsed = stageRequirementsSchema.safeParse({
      workflow_id: formData.get("workflow_id"),
      stage_key: formData.get("stage_key"),
      requires_files: formData.get("requires_files") === "on",
      requires_price: formData.get("requires_price") === "on",
      requires_assigned_technician: formData.get("requires_assigned_technician") === "on",
      requires_qc_pass: formData.get("requires_qc_pass") === "on",
      requires_doctor_approval: formData.get("requires_doctor_approval") === "on",
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    // Verify the workflow belongs to this lab before writing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wf } = await (supabase as any)
      .from("lab_workflow_templates")
      .select("id")
      .eq("id", parsed.data.workflow_id)
      .eq("lab_id", labId)
      .maybeSingle();

    if (!wf) return { ok: false, message: "Workflow not found for this lab." };

    const payload = { ...parsed.data, lab_id: labId, updated_at: new Date().toISOString() };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("stage_requirements")
      .upsert(payload, { onConflict: "workflow_id,stage_key" });

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/workflows");
    return { ok: true, message: "Stage requirements saved." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// ── Technician Stage Permission Actions ───────────────────────────────────────

const techPermissionSchema = z.object({
  technician_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  can_work: z.boolean().default(true),
  can_move_from: z.boolean().default(false),
  can_move_to: z.boolean().default(true),
});

/**
 * Upsert a technician_stage_permissions row.
 * Safe to call multiple times — uses ON CONFLICT UPDATE.
 */
export async function upsertTechnicianStagePermissionAction(
  formData: FormData,
): Promise<WorkflowActionResult> {
  try {
    const { labId, supabase } = await requireWorkflowManager();

    const parsed = techPermissionSchema.safeParse({
      technician_id: formData.get("technician_id"),
      stage_id: formData.get("stage_id"),
      can_work: formData.get("can_work") === "true",
      can_move_from: formData.get("can_move_from") === "true",
      can_move_to: formData.get("can_move_to") === "true",
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    // Verify the technician belongs to this lab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: techRow } = await (supabase as any)
      .from("technicians")
      .select("id")
      .eq("id", parsed.data.technician_id)
      .eq("lab_id", labId)
      .maybeSingle();

    if (!techRow) return { ok: false, message: "Technician not found for this lab." };

    const payload = { ...parsed.data, lab_id: labId };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("technician_stage_permissions")
      .upsert(payload, { onConflict: "technician_id,stage_id" });

    if (error) return { ok: false, message: (error as { message: string }).message };

    revalidatePath("/command-center/master-data/technician-stage-permissions");
    return { ok: true, message: "Permission saved." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
