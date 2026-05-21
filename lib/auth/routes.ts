import type { AppRole } from "@/lib/constants/roles";

export type RouteAccessRule = {
  path: string;
  public?: boolean;
  roles?: AppRole[];
};

export const routeAccessRules: RouteAccessRule[] = [
  { path: "/auth", public: true },
  {
    path: "/dashboard",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    path: "/doctors",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    path: "/clinics",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    path: "/cases",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "doctor"],
  },
  {
    path: "/production",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/design",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/quality-control",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/remakes",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    path: "/technicians",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    // Explicit rule so workspace is clearly accessible to technician role
    // even if the parent /technicians page redirects them away.
    path: "/technicians/workspace",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/invoices",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    path: "/payments",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    path: "/delivery",
    roles: ["super_admin", "lab_owner", "lab_manager", "delivery"],
  },
  {
    path: "/reports",
    roles: ["super_admin", "lab_owner", "lab_manager", "accountant"],
  },
  {
    path: "/settings",
    roles: ["super_admin", "lab_owner"],
  },
  {
    path: "/doctor-portal",
    roles: ["super_admin", "lab_owner", "doctor"],
  },
  {
    path: "/command-center",
    roles: ["super_admin", "lab_owner", "lab_manager"],
  },
  {
    path: "/command-center/platform",
    roles: ["super_admin"],
  },
  {
    path: "/hq",
    roles: ["super_admin"],
  },
  {
    path: "/owner",
    roles: ["super_admin", "lab_owner", "lab_manager"],
  },
  {
    path: "/lab-os",
    roles: ["super_admin", "lab_owner"],
  },
  {
    path: "/finance",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    path: "/inventory",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/cases/log",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    path: "/settings/print",
    roles: ["super_admin", "lab_owner"],
  },
];

export function isPublicPath(pathname: string) {
  return routeAccessRules.some(
    (rule) => rule.public && pathname.startsWith(rule.path),
  );
}

export function getRouteAccessRule(pathname: string) {
  return routeAccessRules
    .filter((rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}
