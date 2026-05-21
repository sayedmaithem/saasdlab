export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hasEmailProviderEnv } from "@/lib/email/resend";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsersOverview } from "@/lib/data/users";
import { hasRole } from "@/lib/permissions";
import { roleLabels } from "@/lib/constants/roles";
import { InviteRowActions } from "@/components/users/invite-row-actions";
import { DeactivateUserButton } from "@/components/users/deactivate-user-button";

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

const AUDIT_LABELS: Record<string, string> = {
  user_created_direct: "Account created",
  invite_record_created: "Invite record saved",
  invite_pending_blocked: "Invite (key missing)",
  user_creation_failed: "Creation failed",
  user_deactivated: "Account deactivated",
  user_linked_technician: "Technician linked",
  user_linked_doctor: "Doctor linked",
};

function auditLabel(action: string) {
  return AUDIT_LABELS[action] ?? action.replaceAll("_", " ");
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function UsersPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);
  const adminKeyConfigured = hasSupabaseAdminEnv();
  const emailProviderConfigured = hasEmailProviderEnv();
  const overview = await getUsersOverview(session);

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

        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            Manage portal accounts for all lab members. Create users directly, save invite records,
            and track account lifecycle from here.
          </p>
          {canManage && (
            <Button asChild>
              <Link href="/command-center/users/new">Create user</Link>
            </Button>
          )}
        </div>

        {/* Status banners */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Admin key status */}
          <div className={`rounded-lg border p-3 text-sm flex items-start gap-2.5 ${adminKeyConfigured ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
            <span className={`mt-1 shrink-0 inline-block h-2 w-2 rounded-full ${adminKeyConfigured ? "bg-green-500" : "bg-amber-400"}`} />
            <div>
              <p className={`font-medium text-xs ${adminKeyConfigured ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                Admin key{adminKeyConfigured ? " — direct creation enabled" : " not configured"}
              </p>
              {!adminKeyConfigured && (
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                  Add{" "}
                  <code className="rounded bg-amber-100 dark:bg-amber-900 px-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
                  {" "}to{" "}
                  <code className="rounded bg-amber-100 dark:bg-amber-900 px-0.5 font-mono text-xs">.env.local</code>
                </p>
              )}
            </div>
          </div>

          {/* Email provider status */}
          <div className={`rounded-lg border p-3 text-sm flex items-start gap-2.5 ${emailProviderConfigured ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
            <span className={`mt-1 shrink-0 inline-block h-2 w-2 rounded-full ${emailProviderConfigured ? "bg-green-500" : "bg-amber-400"}`} />
            <div>
              <p className={`font-medium text-xs ${emailProviderConfigured ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                Email provider{emailProviderConfigured ? " — invites & reset enabled" : " not configured"}
              </p>
              {!emailProviderConfigured && (
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                  Add{" "}
                  <code className="rounded bg-amber-100 dark:bg-amber-900 px-0.5 font-mono text-xs">RESEND_API_KEY</code>
                  {" + "}
                  <code className="rounded bg-amber-100 dark:bg-amber-900 px-0.5 font-mono text-xs">EMAIL_FROM</code>
                  {" "}to enable email invites &amp; password reset.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Active accounts", value: overview.counts.active },
            { label: "Deactivated", value: overview.counts.inactive },
            { label: "Pending invites", value: overview.counts.pending },
            { label: "Unlinked doctors", value: overview.counts.unlinkedDoctors },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending invitations */}
        {overview.pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Pending invitations{" "}
                <span className="font-normal text-muted-foreground">({overview.pendingInvitations.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {overview.pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{inv.fullName ?? inv.email}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}</p>
                      {inv.invitedByName && (
                        <p className="text-xs text-muted-foreground">Invited by {inv.invitedByName} · {formatDate(inv.createdAt)}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge tone={ROLE_TONE[inv.role] ?? "neutral"}>{roleLabels[inv.role as keyof typeof roleLabels] ?? inv.role}</Badge>
                        <Badge tone={inv.status === "failed" ? "red" : "amber"}>
                          {inv.status === "failed" ? "Failed" : inv.status === "pending_internal" ? "Pending login" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    {canManage && (
                      <InviteRowActions
                        invitationId={inv.id}
                        status={inv.status}
                        emailProviderConfigured={emailProviderConfigured}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active users */}
        <Card>
          <CardHeader>
            <CardTitle>
              Active accounts{" "}
              <span className="font-normal text-muted-foreground">({overview.activeUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.activeUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No active portal accounts yet.{" "}
                {canManage && (
                  <Link href="/command-center/users/new" className="text-primary hover:underline font-medium">
                    Create the first user →
                  </Link>
                )}
              </p>
            ) : (
              <div className="divide-y">
                {overview.activeUsers.map((user) => (
                  <div key={user.userId} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {user.fullName ?? <span className="text-muted-foreground italic">No name set</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email ?? "No email"} ·{" "}
                        <span className="font-mono">{user.userId.slice(0, 8)}…</span>
                      </p>
                      {user.technicianName && (
                        <p className="text-xs text-muted-foreground">
                          → Technician:{" "}
                          {canManage ? (
                            <Link href={`/technicians/${user.technicianId}/edit`} className="text-primary hover:underline">
                              {user.technicianName}
                            </Link>
                          ) : user.technicianName}
                        </p>
                      )}
                      {user.doctorName && (
                        <p className="text-xs text-muted-foreground">
                          → Doctor:{" "}
                          {canManage ? (
                            <Link href={`/doctors/${user.doctorId}/edit`} className="text-primary hover:underline">
                              {user.doctorName}
                            </Link>
                          ) : user.doctorName}
                        </p>
                      )}
                      <div className="mt-1.5">
                        <Badge tone={ROLE_TONE[user.role] ?? "neutral"}>
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      </div>
                    </div>
                    {canManage && (
                      <DeactivateUserButton userId={user.userId} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive users */}
        {overview.inactiveUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Deactivated{" "}
                <span className="font-normal text-muted-foreground">({overview.inactiveUsers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {overview.inactiveUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between gap-3 py-3 opacity-60">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{user.fullName ?? <span className="italic">No name set</span>}</p>
                      <p className="text-xs text-muted-foreground">{user.email ?? "No email"}</p>
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
        )}

        {/* Unlinked doctors */}
        {overview.unlinkedDoctors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Doctors without portal access{" "}
                <span className="font-normal text-muted-foreground">({overview.unlinkedDoctors.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                These doctor records have no linked auth account.{" "}
                {canManage && (
                  <Link href="/command-center/users/new" className="text-primary hover:underline">
                    Create a user → set role to Doctor → link the record.
                  </Link>
                )}
              </p>
              <div className="divide-y">
                {overview.unlinkedDoctors.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="text-sm">{doc.displayName}</p>
                    {canManage && (
                      <Link href={`/doctors/${doc.id}/edit`} className="text-xs text-primary hover:underline shrink-0">
                        Link account →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent audit log */}
        {overview.recentAuditLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {overview.recentAuditLogs.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{auditLabel(entry.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        By {entry.actorName ?? "system"}
                        {entry.role ? ` · ${roleLabels[entry.role as keyof typeof roleLabels] ?? entry.role}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{formatDate(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Readiness warnings */}
        {(() => {
          const warnings: { label: string; fix: string; href: string }[] = [];
          if (!emailProviderConfigured)
            warnings.push({ label: "Email provider not configured — password reset and invite emails unavailable", fix: "Add RESEND_API_KEY + EMAIL_FROM", href: "/command-center/cloud" });
          if (!adminKeyConfigured)
            warnings.push({ label: "Admin key not configured — users must be created via Supabase Dashboard", fix: "Add SUPABASE_SERVICE_ROLE_KEY", href: "/command-center/cloud" });
          const hasTechLogin = overview.activeUsers.some((u) => u.role === "technician");
          const hasDoctorLogin = overview.activeUsers.some((u) => u.role === "doctor");
          if (!hasTechLogin)
            warnings.push({ label: "No technician portal account created yet", fix: "Create technician login", href: "/command-center/users/new" });
          if (!hasDoctorLogin)
            warnings.push({ label: "No doctor portal account created yet", fix: "Create doctor login", href: "/command-center/users/new" });
          if (overview.unlinkedDoctors.length > 0)
            warnings.push({ label: `${overview.unlinkedDoctors.length} doctor record(s) have no portal access`, fix: "Link doctor account", href: "/command-center/users/new" });
          if (warnings.length === 0) return null;
          return (
            <Card>
              <CardHeader>
                <CardTitle>Setup checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {warnings.map((w) => (
                    <li key={w.label} className="flex items-start justify-between gap-3 py-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-0.5 shrink-0 inline-block h-2 w-2 rounded-full bg-amber-400" />
                        <p className="text-sm text-muted-foreground">{w.label}</p>
                      </div>
                      <a href={w.href} className="text-xs font-medium text-primary hover:underline shrink-0">
                        {w.fix} →
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })()}

        {/* How-to guide */}
        <Card>
          <CardHeader>
            <CardTitle>How portal accounts work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">1. Create user</p>
                <p className="text-xs">
                  Click{" "}
                  <span className="font-medium text-foreground">Create user</span>{" "}
                  above. Set name, email, role, and optional temporary password.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">2. Link record</p>
                <p className="text-xs">
                  Choose a doctor or technician record to link during creation, or link later from
                  their edit page.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">3. Share credentials</p>
                <p className="text-xs">
                  Share the email and temporary password securely (in person). Never send passwords
                  via email or chat.
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">4. User logs in</p>
                <p className="text-xs">
                  The user logs in and changes their password. Their role and lab are activated
                  automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
