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
