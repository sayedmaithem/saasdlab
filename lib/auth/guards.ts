import { redirect } from "next/navigation";
import { getRouteAccessRule } from "@/lib/auth/routes";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";

export async function requireRouteAccess(pathname: string) {
  const session = await requireAuth();
  const rule = getRouteAccessRule(pathname);

  if (!rule || rule.public || !rule.roles) {
    return session;
  }

  if (!hasRole(session.roles, rule.roles)) {
    redirect("/unauthorized");
  }

  return session;
}
