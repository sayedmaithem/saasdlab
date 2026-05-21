import {
  productionStages,
  stageLabels,
  type ProductionStage,
} from "@/lib/constants/workflow";
import { hasRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants/roles";

export const kanbanStages = productionStages.filter(
  (stage) => !["completed", "on_hold", "cancelled"].includes(stage),
) as ProductionStage[];

export type DelayRisk = "normal" | "due_today" | "overdue" | "blocked";

export function getDelayRisk(params: {
  dueDate: string | null;
  currentStage: ProductionStage;
  missingInfoStatus: string;
}) {
  if (
    params.currentStage === "waiting_doctor_info" ||
    params.missingInfoStatus === "missing"
  ) {
    return "blocked" satisfies DelayRisk;
  }

  if (!params.dueDate) return "normal" satisfies DelayRisk;

  const today = new Date().toISOString().slice(0, 10);

  if (params.dueDate < today) return "overdue" satisfies DelayRisk;
  if (params.dueDate === today) return "due_today" satisfies DelayRisk;

  return "normal" satisfies DelayRisk;
}

export function getDelayRiskLabel(risk: DelayRisk) {
  const labels: Record<DelayRisk, string> = {
    normal: "On track",
    due_today: "Due today",
    overdue: "Overdue",
    blocked: "Blocked",
  };

  return labels[risk];
}

export function canManageProductionBoard(roles: AppRole[]) {
  return hasRole(roles, ["super_admin", "lab_owner", "lab_manager"]);
}

export function canMoveAssignedProduction(roles: AppRole[]) {
  return hasRole(roles, ["technician"]);
}

export function getTransitionError(params: {
  roles: AppRole[];
  currentStage: ProductionStage;
  targetStage: ProductionStage;
  missingInfoStatus: string;
  assignedTechnicianId: string | null;
  currentUserId: string;
  hasPassedQc: boolean;
  delayReason?: string;
  dueDate: string | null;
}) {
  const manager = canManageProductionBoard(params.roles);
  const assignedTechnician =
    canMoveAssignedProduction(params.roles) &&
    params.assignedTechnicianId === params.currentUserId;

  if (!manager && !assignedTechnician) {
    return "You do not have permission to move this case.";
  }

  if (
    params.currentStage === "waiting_doctor_info" &&
    params.targetStage !== "waiting_doctor_info" &&
    !manager
  ) {
    return "Only production managers can release a case waiting for doctor information.";
  }

  if (
    params.missingInfoStatus === "missing" &&
    params.targetStage !== "waiting_doctor_info" &&
    !manager
  ) {
    return "Required doctor information is still missing.";
  }

  if (params.targetStage === "ready_for_delivery" && !params.hasPassedQc) {
    return "Quality control must pass before ready for delivery.";
  }

  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(params.dueDate && params.dueDate < today);

  if (overdue && !params.delayReason?.trim()) {
    return "Delay reason is required for overdue cases.";
  }

  return null;
}

export function transitionTitle(fromStage: ProductionStage, toStage: ProductionStage) {
  return `${stageLabels[fromStage]} moved to ${stageLabels[toStage]}`;
}

// ── Workflow Compatibility Bridge ─────────────────────────────────────────────
//
// This is a PREPARATORY stub for true workflow engine integration.
//
// Current behavior (Phase 15):
//   The production board and moveCaseStageAction use getTransitionError() above,
//   which applies hardcoded rules (missing info, QC pass, role check, overdue reason).
//   The workflow_transitions and stage_requirements tables exist in the DB (migrations
//   0017 + 0019) but are NOT YET queried by any server action.
//
// Future behavior (Phase 16+):
//   validateTransitionAgainstWorkflow() will:
//   1. Look up the lab's active workflow in lab_workflow_templates
//   2. Find the matching workflow_transition row for (from_stage, to_stage)
//   3. If no matching row exists → deny the move
//   4. If allowed_roles is non-empty → check session.roles
//   5. If requires_note → ensure a note was provided
//   6. Check stage_requirements for the target stage
//
// SAFE STATE: This function is a no-op stub. Calling it returns null (no blocker).
// It is wired in so Phase 16 can activate it with a single flag change.
//
// Do NOT activate (change stub to real query) until:
//   a) At least one lab has a fully configured workflow template + stages + transitions
//   b) Integration tests confirm no valid moves are incorrectly blocked
//   c) Production board E2E test passes with workflow validation active

export type WorkflowTransitionCheckParams = {
  labId: string;
  fromStage: string;
  toStage: string;
  roles: AppRole[];
  hasNote: boolean;
};

/**
 * Compatibility bridge stub.
 *
 * Returns null (no blocker) in Phase 15. Will query workflow_transitions in Phase 16+.
 * See comment block above for activation requirements.
 */
export function validateTransitionAgainstWorkflow(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: WorkflowTransitionCheckParams,
): string | null {
  // STUB: always returns null (pass-through) until Phase 16 wires the real query.
  // Phase 16 implementation will replace this body with a Supabase query against
  // workflow_transitions scoped to _params.labId.
  return null;
}
