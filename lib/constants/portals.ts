import type { AppRole } from "@/lib/constants/roles";

export type Portal = {
  id: string;
  label: string;
  href: string;
  description: string;
  roles: AppRole[];
};

export const portals: Portal[] = [
  {
    id: "command-center",
    label: "Command Center",
    href: "/command-center",
    description: "System readiness, cloud status, security controls, and portal management.",
    roles: ["super_admin", "lab_owner", "lab_manager"],
  },
  {
    id: "lab-dashboard",
    label: "Lab Dashboard",
    href: "/dashboard",
    description: "Live production overview, case workbench, and operational KPIs.",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    id: "cases",
    label: "Cases",
    href: "/cases",
    description: "Create and manage dental cases through every production stage.",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    id: "tech-workspace",
    label: "Technician Workspace",
    href: "/technicians/workspace",
    description: "Assigned cases, design uploads, QC tasks, and productivity tracking.",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    id: "finance",
    label: "Finance",
    href: "/invoices",
    description: "Invoices, payments, doctor statements, and financial reports.",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    id: "doctor-portal",
    label: "Doctor Portal",
    href: "/doctor-portal",
    description: "Case status, design approvals, file uploads, and account statement.",
    roles: ["super_admin", "lab_owner", "doctor"],
  },
  {
    id: "delivery",
    label: "Delivery",
    href: "/delivery",
    description: "Delivery assignments, proof of delivery, and status tracking.",
    roles: ["super_admin", "lab_owner", "lab_manager", "delivery"],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    description: "Lab analytics, doctor performance, technician productivity, and finance reporting.",
    roles: ["super_admin", "lab_owner", "lab_manager"],
  },
];

export function getPortalsForRole(roles: AppRole[]): Portal[] {
  return portals.filter((portal) =>
    portal.roles.some((role) => roles.includes(role)),
  );
}

export function getDefaultPortalForRole(role: AppRole): string {
  const defaults: Record<AppRole, string> = {
    super_admin: "/command-center",
    lab_owner: "/command-center",
    lab_manager: "/command-center",
    reception: "/cases",
    technician: "/technicians/workspace",
    accountant: "/invoices",
    doctor: "/doctor-portal",
    delivery: "/delivery",
  };

  return defaults[role] ?? "/dashboard";
}
