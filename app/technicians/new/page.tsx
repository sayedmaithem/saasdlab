export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { TechnicianForm } from "@/components/technicians/technician-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { hasRole } from "@/lib/permissions";

export default async function NewTechnicianPage() {
  const session = await requireRouteAccess("/technicians");
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  if (!canManage) redirect("/unauthorized");

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/technicians">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Lab team</p>
          <h2 className="text-2xl font-semibold">Add technician</h2>
        </div>
        <Button asChild variant="outline">
          <Link href="/technicians">
            <ArrowLeft aria-hidden="true" />
            Back to technicians
          </Link>
        </Button>
      </div>
      <div className="max-w-2xl">
        <TechnicianForm />
      </div>
    </AppShell>
  );
}
