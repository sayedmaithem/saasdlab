export const appRoles = [
  "super_admin",
  "lab_owner",
  "lab_manager",
  "reception",
  "technician",
  "accountant",
  "doctor",
  "delivery",
] as const;

export type AppRole = (typeof appRoles)[number];

export const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  lab_owner: "Lab Owner",
  lab_manager: "Lab Manager",
  reception: "Reception",
  technician: "Technician",
  accountant: "Accountant",
  doctor: "Doctor",
  delivery: "Delivery",
};

export const internalRoles = [
  "super_admin",
  "lab_owner",
  "lab_manager",
  "reception",
  "technician",
  "accountant",
  "delivery",
] as const satisfies readonly AppRole[];

export const clinicalPortalRoles = ["doctor"] as const satisfies readonly AppRole[];

export const managementRoles = [
  "super_admin",
  "lab_owner",
  "lab_manager",
] as const satisfies readonly AppRole[];
