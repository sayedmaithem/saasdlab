import type { AppRole } from "@/lib/constants/roles";
import type { Permission, PermissionResource } from "@/types/app";

export const rolePermissions: Record<AppRole, Permission[]> = {
  super_admin: ["settings:delete"],
  lab_owner: ["settings:update"],
  lab_manager: [
    "dashboard:view",
    "doctor:create",
    "clinic:create",
    "case:create",
    "case:update",
    "case_file:upload",
    "design_version:approve",
    "production_task:update",
    "quality_check:update",
    "invoice:create",
    "payment:create",
    "delivery:update",
    "report:view",
    "settings:view",
  ],
  reception: [
    "dashboard:view",
    "doctor:view",
    "clinic:view",
    "case:create",
    "case:update",
    "case_file:upload",
    "comment:create",
    "delivery:view",
  ],
  technician: [
    "case:view",
    "case_file:view",
    "case_file:upload",
    "design_version:create",
    "production_task:update",
    "comment:create",
    "quality_check:create",
  ],
  accountant: [
    "dashboard:view",
    "doctor:view",
    "clinic:view",
    "case:view",
    "invoice:create",
    "invoice:update",
    "payment:create",
    "payment:update",
    "report:view",
  ],
  doctor: [
    "case:view",
    "case_file:view",
    "case_file:upload",
    "design_version:approve",
    "comment:create",
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
