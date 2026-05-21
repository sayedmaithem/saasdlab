import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";

/**
 * SaaS Owner HQ layout.
 * Hard-gates to super_admin only — redirects all others to /dashboard.
 */
export default async function HqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  if (!hasRole(session.roles, ["super_admin"])) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
