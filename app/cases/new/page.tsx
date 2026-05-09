import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCaseFormOptions } from "@/lib/data/dashboard";

export default async function NewCasePage() {
  const options = await getCaseFormOptions();

  return (
    <AppShell labName="LabFlow" activeHref="/cases">
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
          source={options.source}
        />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold">Stored file policy</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                STL, OBJ, PLY, DICOM, PDF, image, and exocad files are modeled
                for Supabase Storage under lab-scoped paths.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Security posture</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Case creation requires an authenticated user with a lab
                membership. RLS policies enforce lab isolation.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Next TODO</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add signed upload flow that writes metadata to case_files only
                after Supabase Storage confirms the upload.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
