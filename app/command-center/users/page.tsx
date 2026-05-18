export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLabUsers } from "@/lib/data/users";
import { hasRole } from "@/lib/permissions";
import { roleLabels } from "@/lib/constants/roles";

const ROLE_TONE: Record<string, "default" | "blue" | "amber" | "green" | "red" | "neutral"> = {
  super_admin: "red",
  lab_owner: "default",
  lab_manager: "blue",
  reception: "blue",
  technician: "amber",
  accountant: "neutral",
  doctor: "green",
  delivery: "neutral",
};

export default async function UsersPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner"]);
  const users = await getLabUsers(session);

  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Portal Users"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            All user accounts linked to this lab. To add a new user, create them in{" "}
            <span className="font-medium text-foreground">
              Supabase Dashboard → Authentication → Users
            </span>
            , copy their UID, then link it from the{" "}
            <Link href="/technicians" className="font-medium text-primary hover:underline">
              technician
            </Link>{" "}
            or{" "}
            <Link href="/doctors" className="font-medium text-primary hover:underline">
              doctor
            </Link>{" "}
            edit page.
          </p>
        </div>

        {/* Active users */}
        <Card>
          <CardHeader>
            <CardTitle>
              Active users{" "}
              <span className="font-normal text-muted-foreground">({activeUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active portal accounts yet. Link accounts from technician or doctor edit pages.
              </p>
            ) : (
              <div className="divide-y">
                {activeUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {user.fullName ?? (
                          <span className="text-muted-foreground italic">No name set</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email ?? "No email"} ·{" "}
                        <span className="font-mono">{user.userId.slice(0, 8)}…</span>
                      </p>
                      {user.technicianName ? (
                        <p className="text-xs text-muted-foreground">
                          → Technician:{" "}
                          {canManage ? (
                            <Link
                              href={`/technicians/${user.technicianId}/edit`}
                              className="text-primary hover:underline"
                            >
                              {user.technicianName}
                            </Link>
                          ) : (
                            user.technicianName
                          )}
                        </p>
                      ) : null}
                      {user.doctorName ? (
                        <p className="text-xs text-muted-foreground">
                          → Doctor:{" "}
                          {canManage ? (
                            <Link
                              href={`/doctors/${user.doctorId}/edit`}
                              className="text-primary hover:underline"
                            >
                              {user.doctorName}
                            </Link>
                          ) : (
                            user.doctorName
                          )}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <Badge tone={ROLE_TONE[user.role] ?? "neutral"}>
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive users */}
        {inactiveUsers.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Deactivated{" "}
                <span className="font-normal text-muted-foreground">({inactiveUsers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {inactiveUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between gap-3 py-3 opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {user.fullName ?? (
                          <span className="italic">No name set</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email ?? "No email"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone="neutral">{roleLabels[user.role] ?? user.role}</Badge>
                      <Badge tone="neutral">Deactivated</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* How-to guide */}
        <Card>
          <CardHeader>
            <CardTitle>How portal accounts work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">1. Create in Supabase</p>
                <p className="text-xs">
                  Go to{" "}
                  <span className="font-medium text-foreground">
                    Supabase → Authentication → Users → Add user
                  </span>
                  . Set an email and temporary password.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">2. Copy the User UID</p>
                <p className="text-xs">
                  After creating the user, copy their UUID from the Supabase user list.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">3. Link from LabFlow</p>
                <p className="text-xs">
                  Open the technician or doctor edit page, paste the UUID into the &quot;Portal account&quot;
                  section, and click &quot;Link account&quot;.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">4. User logs in</p>
                <p className="text-xs">
                  The user logs in with the credentials you created. Their role and lab are
                  activated automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
