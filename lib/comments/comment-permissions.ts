import { hasRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants/roles";

export const commentVisibilities = ["internal", "doctor_visible"] as const;

export type CommentVisibility = (typeof commentVisibilities)[number];

export const commentVisibilityLabels: Record<CommentVisibility, string> = {
  internal: "Internal",
  doctor_visible: "Doctor visible",
};

export type CommentAccessCase = {
  doctorProfileId: string | null;
  assignedTechnicianId: string | null;
};

export function isLabStaffCommentRole(roles: AppRole[]) {
  return hasRole(roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "reception",
    "technician",
    "accountant",
    "delivery",
  ]);
}

export function canViewCaseComment(params: {
  roles: AppRole[];
  userId: string;
  item: CommentAccessCase;
  visibility: CommentVisibility;
}) {
  if (params.visibility === "doctor_visible") {
    return (
      isLabStaffCommentRole(params.roles) ||
      params.item.doctorProfileId === params.userId
    );
  }

  return isLabStaffCommentRole(params.roles);
}

export function canCreateCaseComment(params: {
  roles: AppRole[];
  userId: string;
  item: CommentAccessCase;
  visibility: CommentVisibility;
}) {
  if (params.item.doctorProfileId === params.userId) {
    return params.visibility === "doctor_visible";
  }

  if (params.roles.includes("technician")) {
    return params.item.assignedTechnicianId === params.userId;
  }

  return isLabStaffCommentRole(params.roles);
}

export function getAllowedCommentVisibilities(params: {
  roles: AppRole[];
  userId: string;
  item: CommentAccessCase;
}): CommentVisibility[] {
  if (params.item.doctorProfileId === params.userId) {
    return ["doctor_visible"];
  }

  if (isLabStaffCommentRole(params.roles)) {
    return ["internal", "doctor_visible"];
  }

  return [];
}
