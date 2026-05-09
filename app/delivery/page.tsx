export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DeliveryDashboard } from "@/components/delivery/delivery-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDeliveryData } from "@/lib/data/delivery";

export default async function DeliveryPage() {
  const session = await requireRouteAccess("/delivery");
  const data = await getDeliveryData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/delivery">
      <DeliveryDashboard items={data.items} deliveryPeople={data.deliveryPeople} />
    </AppShell>
  );
}
