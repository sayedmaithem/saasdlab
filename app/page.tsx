export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentSessionContext } from "@/lib/auth/session";
import type { AppRole } from "@/lib/constants/roles";

const portalByRole: Record<AppRole, string> = {
  super_admin: "/command-center",
  lab_owner: "/command-center",
  lab_manager: "/command-center",
  reception: "/cases",
  technician: "/technicians/workspace",
  accountant: "/invoices",
  doctor: "/doctor-portal",
  delivery: "/delivery",
};

export default async function HomePage() {
  const session = await getCurrentSessionContext();

  if (!session) {
    redirect("/auth");
  }

  redirect(portalByRole[session.role] ?? "/dashboard");
}
