import type { AppRole } from "@/lib/constants/roles";
import type { Permission, PermissionResource } from "@/types/app";

export const rolePermissions: Record<AppRole, Permission[]> = {
  super_admin: [
    "dashboard:view",
    "doctor:view",
    "doctor:create",
    "clinic:view",
    "clinic:create",
    "case:view",
    "case:create",
    "case:update",
    "case_file:view",
    "case_file:upload",
    "design_version:view",
    "design_version:create",
    "design_version:approve",
    "production_task:view",
    "production_task:update",
    "comment:view",
    "comment:create",
    "quality_check:view",
    "quality_check:create",
    "quality_check:update",
    "invoice:view",
    "invoice:create",
    "invoice:update",
    "payment:view",
    "payment:create",
    "payment:update",
    "delivery:view",
    "delivery:update",
    "report:view",
    "settings:view",
    "settings:update",
    "settings:delete",
  ],
  lab_owner: [
    "dashboard:view",
    "doctor:view",
    "doctor:create",
    "clinic:view",
    "clinic:create",
    "case:view",
    "case:create",
    "case:update",
    "case_file:view",
    "case_file:upload",
    "design_version:view",
    "design_version:create",
    "design_version:approve",
    "production_task:view",
    "production_task:update",
    "comment:view",
    "comment:create",
    "quality_check:view",
    "quality_check:create",
    "quality_check:update",
    "invoice:view",
    "invoice:create",
    "invoice:update",
    "payment:view",
    "payment:create",
    "payment:update",
    "delivery:view",
    "delivery:update",
    "report:view",
    "settings:view",
    "settings:update",
  ],
  lab_manager: [
    "dashboard:view",
    "doctor:view",
    "clinic:view",
    "case:view",
    "case:create",
    "case:update",
    "case_file:view",
    "case_file:upload",
    "design_version:view",
    "design_version:create",
    "design_version:approve",
    "production_task:view",
    "production_task:update",
    "quality_check:view",
    "quality_check:create",
    "quality_check:update",
    "comment:view",
    "comment:create",
    "delivery:view",
    "delivery:update",
    "report:view",
  ],
  reception: [
    "dashboard:view",
    "doctor:view",
    "clinic:view",
    "case:view",
    "case:create",
    "case:update",
    "case_file:view",
    "case_file:upload",
    "comment:view",
    "comment:create",
    "delivery:view",
  ],
  technician: [
    "case:view",
    "case_file:view",
    "case_file:upload",
    "design_version:view",
    "design_version:create",
    "production_task:view",
    "production_task:update",
    "comment:view",
    "comment:create",
    "quality_check:view",
    "quality_check:create",
  ],
  accountant: [
    "doctor:view",
    "clinic:view",
    "case:view",
    "invoice:view",
    "invoice:create",
    "invoice:update",
    "payment:view",
    "payment:create",
    "payment:update",
    "report:view",
  ],
  doctor: [
    "case:view",
    "case_file:view",
    "case_file:upload",
    "design_version:view",
    "design_version:approve",
    "comment:view",
    "comment:create",
    "invoice:view",
  ],
  delivery: ["case:view", "delivery:view", "delivery:update"],
};

export function hasRole(userRoles: AppRole[], allowedRoles: AppRole[]) {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function hasPermission(userRoles: AppRole[], permission: Permission) {
  if (userRoles.includes("super_admin")) {
    return true;
  }

  return userRoles.some((role) => rolePermissions[role]?.includes(permission));
}

export function canAccessResource(
  userRoles: AppRole[],
  resource: PermissionResource,
) {
  if (userRoles.includes("super_admin")) {
    return true;
  }

  return userRoles.some((role) =>
    rolePermissions[role]?.some((permission) =>
      permission.startsWith(`${resource}:`),
    ),
  );
}

export function canViewFinancials(userRoles: AppRole[]) {
  return (
    hasPermission(userRoles, "invoice:view") ||
    hasPermission(userRoles, "payment:view")
  );
}

export function canManageCases(userRoles: AppRole[]) {
  return (
    hasPermission(userRoles, "case:create") ||
    hasPermission(userRoles, "case:update")
  );
}

export function canUploadCaseFiles(userRoles: AppRole[]) {
  return hasPermission(userRoles, "case_file:upload");
}

export function canApproveDesigns(userRoles: AppRole[]) {
  return hasPermission(userRoles, "design_version:approve");
}

export function canManageUsers(userRoles: AppRole[]) {
  return (
    hasRole(userRoles, ["super_admin", "lab_owner"]) ||
    hasPermission(userRoles, "settings:update")
  );
}

export function canViewReports(userRoles: AppRole[]) {
  return hasPermission(userRoles, "report:view");
}

export function canManageDelivery(userRoles: AppRole[]) {
  return hasPermission(userRoles, "delivery:update");
}
