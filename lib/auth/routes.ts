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
    path: "/doctor-portal",
    roles: ["doctor"],
  },
];

export function isPublicPath(pathname: string) {
  return routeAccessRules.some(
    (rule) => rule.public && pathname.startsWith(rule.path),
  );
}
