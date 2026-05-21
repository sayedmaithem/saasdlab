import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";

/**
 * Lab Owner HQ layout.
 * Gate: lab_owner, lab_manager, super_admin only.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
