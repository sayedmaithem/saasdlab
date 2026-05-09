export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PriceListEditor } from "@/components/doctors/price-list-editor";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPrices, getDoctorProfile } from "@/lib/data/doctors";

export default async function DoctorPricesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/doctors");
  const { id } = await params;
  const [doctor, prices] = await Promise.all([
    getDoctorProfile(session, id),
    getDoctorPrices(session, id),
  ]);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctors">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Doctor-specific pricing
          </p>
          <h2 className="text-2xl font-semibold">{doctor.displayName}</h2>
        </div>
        <Button asChild variant="outline">
          <Link href={`/doctors/${id}`}>
            <ArrowLeft aria-hidden="true" />
            Profile
          </Link>
        </Button>
      </div>
      <PriceListEditor doctorId={id} prices={prices} />
    </AppShell>
  );
}
