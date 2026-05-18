import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { productionStages, stageLabels } from "@/lib/constants/workflow";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string;
  lab_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  lab_id: string;
  stage_key: string;
  name: string;
  description: string | null;
  sort_order: number;
  color: string | null;
  icon: string | null;
  requires_technician: boolean;
  requires_qc: boolean;
  requires_doctor_approval: boolean;
  blocks_delivery: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplateWithStages extends WorkflowTemplate {
  stages: WorkflowStage[];
}

export interface LabWorkflowSummary {
  hasCustomWorkflows: boolean;
  defaultTemplate: WorkflowTemplate | null;
  templateCount: number;
  // Fixed enum stages for reference panel
  fixedStages: Array<{ key: string; label: string; index: number }>;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetch all active workflow templates for the current lab.
 * Uses `as any` because lab_workflow_templates is not in the generated types yet
 * (added in migration 0017; types are regenerated at build time from live DB).
 */
export async function getLabWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lab_workflow_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) {
    console.error("[getLabWorkflowTemplates]", (error as { message: string }).message);
    return [];
  }

  return (data as WorkflowTemplate[]) ?? [];
}

/**
 * Fetch a single workflow template with its ordered stages.
 */
export async function getWorkflowWithStages(
  templateId: string,
): Promise<WorkflowTemplateWithStages | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template, error: tErr } = await (supabase as any)
    .from("lab_workflow_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tErr || !template) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages, error: sErr } = await (supabase as any)
    .from("lab_workflow_stages")
    .select("*")
    .eq("workflow_id", templateId)
    .eq("is_active", true)
    .order("sort_order");

  if (sErr) {
    console.error("[getWorkflowWithStages stages]", (sErr as { message: string }).message);
  }

  return {
    ...(template as WorkflowTemplate),
    stages: (stages as WorkflowStage[]) ?? [],
  };
}

/**
 * High-level summary used by the Workflow Engine overview page
 * and the Production Board mode badge.
 */
export async function getLabWorkflowSummary(): Promise<LabWorkflowSummary> {
  const fixedStages = productionStages.map((key, index) => ({
    key,
    label: stageLabels[key],
    index,
  }));

  if (!hasSupabaseEnv()) {
    return {
      hasCustomWorkflows: false,
      defaultTemplate: null,
      templateCount: 0,
      fixedStages,
    };
  }

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lab_workflow_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false });

  if (error) {
    console.error("[getLabWorkflowSummary]", (error as { message: string }).message);
    return {
      hasCustomWorkflows: false,
      defaultTemplate: null,
      templateCount: 0,
      fixedStages,
    };
  }

  const templates = (data as WorkflowTemplate[]) ?? [];
  const defaultTemplate = templates.find((t) => t.is_default) ?? null;

  return {
    hasCustomWorkflows: templates.length > 0,
    defaultTemplate,
    templateCount: templates.length,
    fixedStages,
  };
}
