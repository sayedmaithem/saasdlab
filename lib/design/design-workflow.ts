import { hasRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants/roles";

export const designStatuses = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "needs_changes",
] as const;

export type DesignStatus = (typeof designStatuses)[number];

export const designStatusLabels: Record<DesignStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs changes",
};

export type DesignAccessCase = {
  doctorProfileId: string | null;
  assignedTechnicianId: string | null;
};

export function canUploadDesignVersion(params: {
  roles: AppRole[];
  userId: string;
  item: DesignAccessCase;
}) {
  return (
    hasRole(params.roles, ["super_admin", "lab_owner", "lab_manager"]) ||
    params.item.assignedTechnicianId === params.userId
  );
}

export function canDecideDesignVersion(params: {
  roles: AppRole[];
  userId: string;
  item: DesignAccessCase;
}) {
  return (
    hasRole(params.roles, ["super_admin", "lab_owner", "lab_manager"]) ||
    params.item.doctorProfileId === params.userId
  );
}

export function canCommentOnDesignVersion(params: {
  roles: AppRole[];
  userId: string;
  item: DesignAccessCase;
}) {
  return canUploadDesignVersion(params) || canDecideDesignVersion(params);
}
