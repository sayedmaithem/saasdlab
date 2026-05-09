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
    path: "/cases",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "doctor"],
  },
  {
    path: "/production",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/technicians",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    path: "/invoices",
    roles: ["super_admin", "lab_owner", "accountant", "doctor"],
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
