import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { productionStages, stageLabels } from "@/lib/constants/workflow";
import type { AppRole } from "@/lib/constants/roles";

// ── Internal helper types ─────────────────────────────────────────────────────

type StageRequirementsRow = {
  requires_files: boolean;
  requires_price: boolean;
  requires_assigned_technician: boolean;
  requires_qc_pass: boolean;
  requires_doctor_approval: boolean;
};

type TechPermissionRow = {
  can_work: boolean;
  can_move_from: boolean;
  can_move_to: boolean;
};

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
  /** Merged from stage_requirements table — null if no row configured */
  requirements?: StageRequirements | null;
}

export interface StageRequirements {
  workflow_id: string;
  stage_key: string;
  requires_files: boolean;
  requires_price: boolean;
  requires_assigned_technician: boolean;
  requires_qc_pass: boolean;
  requires_doctor_approval: boolean;
}

export interface WorkflowTemplateWithStages extends WorkflowTemplate {
  stages: WorkflowStage[];
}

// ── Technician Stage Permission types for matrix UI ───────────────────────────

export interface TechnicianPermissionRow {
  id?: string;
  technician_id: string;
  stage_id: string;
  stage_key: string;
  can_work: boolean;
  can_move_from: boolean;
  can_move_to: boolean;
}

export interface TechnicianPermissionsForMatrix {
  technicianId: string;
  technicianName: string;
  permissions: TechnicianPermissionRow[];
}

export interface PermissionsMatrixData {
  stages: WorkflowStage[]; // ordered stages from active workflow
  technicians: TechnicianPermissionsForMatrix[];
  workflowId: string | null;
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
 * Fetch all active workflow templates for the current lab, including their stages.
 * Uses `as any` because lab_workflow_templates is not in the generated types yet.
 */
export async function getLabWorkflowTemplates(): Promise<WorkflowTemplateWithStages[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: templates, error: tErr } = await sb
    .from("lab_workflow_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name");

  if (tErr) {
    console.error("[getLabWorkflowTemplates]", (tErr as { message: string }).message);
    return [];
  }

  const tpls = (templates as WorkflowTemplate[]) ?? [];
  if (tpls.length === 0) return [];

  // Fetch all stages for all templates in one query
  const templateIds = tpls.map((t) => t.id);
  const { data: stages, error: sErr } = await sb
    .from("lab_workflow_stages")
    .select("*")
    .in("workflow_id", templateIds)
    .eq("is_active", true)
    .order("sort_order");

  if (sErr) {
    console.error("[getLabWorkflowTemplates stages]", (sErr as { message: string }).message);
  }

  const allStages = (stages as WorkflowStage[]) ?? [];

  // Fetch all stage_requirements for all templates in one batch query
  const { data: reqRows } = await sb
    .from("stage_requirements")
    .select("workflow_id, stage_key, requires_files, requires_price, requires_assigned_technician, requires_qc_pass, requires_doctor_approval")
    .in("workflow_id", templateIds);

  // Build a lookup map keyed by "workflowId:stageKey"
  const reqMap = new Map<string, StageRequirements>();
  for (const r of (reqRows as StageRequirements[]) ?? []) {
    reqMap.set(`${r.workflow_id}:${r.stage_key}`, r);
  }

  return tpls.map((t) => ({
    ...t,
    stages: allStages
      .filter((s) => s.workflow_id === t.id)
      .map((s) => ({
        ...s,
        requirements: reqMap.get(`${t.id}:${s.stage_key}`) ?? null,
      })),
  }));
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

// ── Workflow Transition Runtime Validation ────────────────────────────────────

type TransitionRow = {
  id: string;
  allowed_roles: string[];
  requires_note: boolean;
};

/**
 * Server-side workflow transition validator.
 *
 * Behavior:
 *   - No Supabase env → return null (preview/dev fallback mode)
 *   - Lab has no active workflow_transitions at all → return null (fallback mode)
 *   - Transitions exist AND this specific move is NOT found → return blocked message
 *   - Transition found → check allowed_roles and requires_note
 *
 * This replaces the stub in lib/production/stage-rules.ts and is called from
 * moveCaseStageAction() AFTER getTransitionError() has already passed.
 * Hardcoded rules always run first; workflow rules run second as an additive gate.
 *
 * Safety: if from_stage_key = '*' exists for the target stage, it acts as a
 * catch-all allowing the move from any source stage.
 */
export async function checkWorkflowTransition(params: {
  labId: string;
  fromStage: string;
  toStage: string;
  roles: AppRole[];
  hasNote: boolean;
}): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Step 1: Check if lab has any active workflow transitions configured at all.
  // If ZERO transitions exist → fallback mode (return null, hardcoded rules apply).
  const { count: transitionCount, error: countErr } = await sb
    .from("workflow_transitions")
    .select("id", { count: "exact", head: true })
    .eq("lab_id", params.labId)
    .eq("is_active", true);

  if (countErr || !transitionCount || transitionCount === 0) {
    // No transitions configured → fallback to hardcoded rules
    return null;
  }

  // Step 2: Transitions exist. Look for a matching row.
  // Accepts: exact (fromStage → toStage) OR wildcard (* → toStage).
  const { data: rows, error: rowErr } = await sb
    .from("workflow_transitions")
    .select("id, allowed_roles, requires_note")
    .eq("lab_id", params.labId)
    .eq("to_stage_key", params.toStage)
    .eq("is_active", true)
    .in("from_stage_key", [params.fromStage, "*"])
    .limit(2);

  if (rowErr) {
    // Query error → fail-open (don't block production on DB errors)
    console.error("[checkWorkflowTransition]", rowErr.message);
    return null;
  }

  const transitions = (rows as TransitionRow[]) ?? [];

  if (transitions.length === 0) {
    return `Stage move from "${params.fromStage.replaceAll("_", " ")}" to "${params.toStage.replaceAll("_", " ")}" is not permitted by your lab workflow. Contact your lab manager.`;
  }

  // Use the most specific match (exact > wildcard)
  const exact = transitions.find((t) => !t.allowed_roles.includes("*"));
  const match = exact ?? transitions[0]!;

  // Check role restriction
  const allowedRoles = match.allowed_roles as string[];
  if (
    allowedRoles.length > 0 &&
    !params.roles.some((r) => allowedRoles.includes(r))
  ) {
    return "Your role is not permitted to make this stage transition.";
  }

  // Check note requirement
  if (match.requires_note && !params.hasNote) {
    return "A note or reason is required for this stage transition.";
  }

  return null; // Transition permitted
}

// ── Technician Stage Permission Check ────────────────────────────────────────

/**
 * Checks whether a technician is allowed to perform an action on a stage.
 *
 * Behavior:
 *   - No Supabase env → null (fallback)
 *   - Lab has 0 technician_stage_permissions rows → null (fallback mode)
 *   - Permissions exist + this technician has no row for this stage → blocked
 *   - Permissions exist + row found → check can_work / can_move_from / can_move_to
 *
 * The stage lookup goes through the lab's default active workflow template.
 * If no workflow is configured, falls back to null.
 *
 * @param technicianProfileId  The profile.id of the acting user (session.userId)
 * @param action               Which capability to check
 */
export async function checkTechnicianStagePermission(params: {
  labId: string;
  technicianProfileId: string;
  toStageKey: string;
  action: "can_work" | "can_move_from" | "can_move_to";
}): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Step 1: Check if lab has any technician_stage_permissions configured.
  // 0 permissions → fallback mode.
  const { count: permCount, error: countErr } = await sb
    .from("technician_stage_permissions")
    .select("id", { count: "exact", head: true })
    .eq("lab_id", params.labId);

  if (countErr || !permCount || permCount === 0) return null;

  // Step 2: Find the technician record by profile_id.
  const { data: techRow, error: techErr } = await sb
    .from("technicians")
    .select("id")
    .eq("lab_id", params.labId)
    .eq("profile_id", params.technicianProfileId)
    .maybeSingle();

  if (techErr || !techRow) {
    // Profile is not a technician record — fall open (manager calling this)
    return null;
  }
  const technicianId = (techRow as { id: string }).id;

  // Step 3: Find the stage_id from the default active workflow.
  const { data: stageRow, error: stageErr } = await sb
    .from("lab_workflow_stages")
    .select("id, workflow_id")
    .eq("lab_id", params.labId)
    .eq("stage_key", params.toStageKey)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (stageErr || !stageRow) {
    // Stage not in workflow — fallback (no rule to enforce)
    return null;
  }
  const stageId = (stageRow as { id: string; workflow_id: string }).id;

  // Step 4: Fetch the permission row.
  const { data: permRow, error: permErr } = await sb
    .from("technician_stage_permissions")
    .select("can_work, can_move_from, can_move_to")
    .eq("lab_id", params.labId)
    .eq("technician_id", technicianId)
    .eq("stage_id", stageId)
    .maybeSingle();

  if (permErr) {
    // Query error → fail-open
    console.error("[checkTechnicianStagePermission]", permErr.message);
    return null;
  }

  if (!permRow) {
    // Permissions table is configured but this technician has no row for this stage.
    return `You are not permitted to work on the "${params.toStageKey.replaceAll("_", " ")}" stage. Contact your lab manager to update your stage permissions.`;
  }

  const perm = permRow as TechPermissionRow;
  if (!perm[params.action]) {
    const actionLabel =
      params.action === "can_work" ? "work on" :
      params.action === "can_move_from" ? "move cases from" : "move cases to";
    return `You are not permitted to ${actionLabel} the "${params.toStageKey.replaceAll("_", " ")}" stage.`;
  }

  return null; // Permitted
}

// ── Stage Requirements Check ──────────────────────────────────────────────────

/**
 * Checks stage_requirements for the target stage and validates the case meets them.
 *
 * Behavior:
 *   - No Supabase env → null (fallback)
 *   - No active workflow for lab → null (fallback)
 *   - No stage_requirements row for this stage → null (no rules)
 *   - Requirements row found → check each requirement against case data
 *
 * Each requirement is checked only if the flag is true.
 * Returns the first blocking requirement as a string.
 */
export async function checkStageRequirements(params: {
  labId: string;
  caseId: string;
  toStageKey: string;
}): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Step 1: Find the active default workflow for this lab.
  const { data: wfRow, error: wfErr } = await sb
    .from("lab_workflow_templates")
    .select("id")
    .eq("lab_id", params.labId)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();

  if (wfErr || !wfRow) {
    // Also try any active template (not just default)
    const { data: anyWf, error: anyWfErr } = await sb
      .from("lab_workflow_templates")
      .select("id")
      .eq("lab_id", params.labId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (anyWfErr || !anyWf) return null;
    // Use anyWf (any active template) when no default is set
    return await _checkRequirementsForWorkflow({
      sb,
      workflowId: (anyWf as { id: string }).id,
      labId: params.labId,
      caseId: params.caseId,
      toStageKey: params.toStageKey,
    });
  }

  return await _checkRequirementsForWorkflow({
    sb,
    workflowId: (wfRow as { id: string }).id,
    labId: params.labId,
    caseId: params.caseId,
    toStageKey: params.toStageKey,
  });
}

async function _checkRequirementsForWorkflow(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any;
  workflowId: string;
  labId: string;
  caseId: string;
  toStageKey: string;
}): Promise<string | null> {
  const { sb, workflowId, labId, caseId, toStageKey } = params;

  // Fetch stage_requirements for this workflow + stage_key.
  const { data: reqRow, error: reqErr } = await sb
    .from("stage_requirements")
    .select(
      "requires_files, requires_price, requires_assigned_technician, requires_qc_pass, requires_doctor_approval",
    )
    .eq("workflow_id", workflowId)
    .eq("stage_key", toStageKey)
    .maybeSingle();

  if (reqErr || !reqRow) return null; // No requirements for this stage

  const req = reqRow as StageRequirementsRow;

  // Fetch the case data needed for checks.
  const { data: caseRow, error: caseErr } = await sb
    .from("cases")
    .select("total_price, assigned_technician_id, requires_doctor_approval")
    .eq("lab_id", labId)
    .eq("id", caseId)
    .maybeSingle();

  if (caseErr || !caseRow) return null;
  const c = caseRow as {
    total_price: number | null;
    assigned_technician_id: string | null;
    requires_doctor_approval: boolean;
  };

  // Check: requires_assigned_technician
  if (req.requires_assigned_technician && !c.assigned_technician_id) {
    return "This stage requires a technician to be assigned to the case before proceeding.";
  }

  // Check: requires_price
  if (req.requires_price && (!c.total_price || c.total_price <= 0)) {
    return "This stage requires a case price to be configured before proceeding.";
  }

  // Check: requires_files
  if (req.requires_files) {
    const { count: fileCount, error: fileErr } = await sb
      .from("case_files")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("case_id", caseId);
    if (!fileErr && (!fileCount || fileCount === 0)) {
      return "This stage requires at least one case file to be uploaded before proceeding.";
    }
  }

  // Check: requires_qc_pass
  if (req.requires_qc_pass) {
    const { data: qcRow, error: qcErr } = await sb
      .from("quality_checks")
      .select("result")
      .eq("lab_id", labId)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const latestResult = (qcRow as { result: string } | null)?.result;
    if (!qcErr && latestResult !== "passed") {
      return "This stage requires a passed quality check before proceeding.";
    }
  }

  // Check: requires_doctor_approval (only if the case has requires_doctor_approval=true)
  if (req.requires_doctor_approval && c.requires_doctor_approval) {
    const { data: approvalRow, error: approvalErr } = await sb
      .from("design_approvals")
      .select("status")
      .eq("lab_id", labId)
      .eq("case_id", caseId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (!approvalErr && !approvalRow) {
      return "Doctor approval is required before this stage. Ask the referring doctor to approve the design.";
    }
  }

  return null; // All requirements met
}

// ── Permissions Matrix Data ───────────────────────────────────────────────────

/**
 * Loads all data needed for the Technician Stage Permissions matrix UI.
 *
 * Returns:
 *   - stages: ordered stages from the lab's default active workflow
 *   - technicians: all active technicians with their permission rows merged
 *   - workflowId: the active workflow ID (needed for upsert operations)
 *
 * Fallback: if no workflow or no technicians, returns empty arrays.
 */
export async function getPermissionsMatrixData(labId: string): Promise<PermissionsMatrixData> {
  const empty: PermissionsMatrixData = { stages: [], technicians: [], workflowId: null };
  if (!hasSupabaseEnv() || !labId) return empty;

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Step 1: Find active workflow (default first, then any)
  const { data: wfRow } = await sb
    .from("lab_workflow_templates")
    .select("id")
    .eq("lab_id", labId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!wfRow) return empty;
  const workflowId = (wfRow as { id: string }).id;

  // Step 2: Load stages + technicians + existing permissions in parallel
  const [stagesResult, techResult, permsResult] = await Promise.all([
    sb
      .from("lab_workflow_stages")
      .select("id, stage_key, name, sort_order, requires_technician, requires_qc, requires_doctor_approval, blocks_delivery, is_active, workflow_id, lab_id, description, color, icon, created_at, updated_at")
      .eq("workflow_id", workflowId)
      .eq("is_active", true)
      .order("sort_order"),
    sb
      .from("technicians")
      .select("id, profile_id, display_name")
      .eq("lab_id", labId)
      .order("display_name"),
    sb
      .from("technician_stage_permissions")
      .select("id, technician_id, stage_id, can_work, can_move_from, can_move_to")
      .eq("lab_id", labId),
  ]);

  const stages = (stagesResult.data ?? []) as WorkflowStage[];
  const rawTechs = (techResult.data ?? []) as Array<{ id: string; profile_id: string | null; display_name: string }>;
  const rawPerms = (permsResult.data ?? []) as Array<{
    id: string;
    technician_id: string;
    stage_id: string;
    can_work: boolean;
    can_move_from: boolean;
    can_move_to: boolean;
  }>;

  // Build permission lookup: technicianId → stageId → perm row
  const permLookup = new Map<string, Map<string, typeof rawPerms[0]>>();
  for (const p of rawPerms) {
    if (!permLookup.has(p.technician_id)) permLookup.set(p.technician_id, new Map());
    permLookup.get(p.technician_id)!.set(p.stage_id, p);
  }

  const technicians: TechnicianPermissionsForMatrix[] = rawTechs
    .filter((t) => t.profile_id) // only technicians with portal accounts
    .map((t) => ({
      technicianId: t.id,
      technicianName: t.display_name,
      permissions: stages.map((s) => {
        const existing = permLookup.get(t.id)?.get(s.id);
        return {
          id: existing?.id,
          technician_id: t.id,
          stage_id: s.id,
          stage_key: s.stage_key,
          can_work: existing?.can_work ?? true,      // default true (open)
          can_move_from: existing?.can_move_from ?? false,
          can_move_to: existing?.can_move_to ?? true, // default true (open)
        } satisfies TechnicianPermissionRow;
      }),
    }));

  return { stages, technicians, workflowId };
}
