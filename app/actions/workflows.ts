"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole } from "@/lib/permissions";

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
