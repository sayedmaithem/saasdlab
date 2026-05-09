import { redirect } from "next/navigation";
import { hasPermission, hasRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext, Permission } from "@/types/app";

export function ProtectedRoute({
  children,
  session,
  roles,
  permission,
}: {
  children: React.ReactNode;
  session: AuthSessionContext | null;
  roles?: AppRole[];
  permission?: Permission;
}) {
  if (!session) {
    redirect("/auth");
  }

  if (roles && !hasRole(session.roles, roles)) {
    redirect("/dashboard");
  }

  if (permission && !hasPermission(session.roles, permission)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
