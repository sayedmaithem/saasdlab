export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getCaseFormOptions } from "@/lib/data/dashboard";

export default async function NewCasePage() {
  const session = await requireRouteAccess("/cases/new");
  const options = await getCaseFormOptions(session);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/cases">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Case intake
          </p>
          <h2 className="text-2xl font-semibold">New dental case</h2>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Dashboard
          </Link>
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <NewCaseForm
          doctors={options.doctors}
          clinics={options.clinics}
          operations={options.operations}
          materials={options.materials}
          source={options.source}
        />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold">Supported file types</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                STL, OBJ, PLY, DICOM, PDF, image, and exocad files can be
                attached to the case after it is created.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Missing information</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                If doctor information is incomplete, the case will be flagged
                and held until the required fields are resolved.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Isolation</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cases are scoped to your lab. Other labs cannot access your
                case data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
