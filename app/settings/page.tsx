export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getSettingsData } from "@/lib/data/settings";

export default async function SettingsPage() {
  const session = await requireRouteAccess("/settings");
  const data = await getSettingsData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/settings">
      <SettingsDashboard data={data} />
    </AppShell>
  );
}
