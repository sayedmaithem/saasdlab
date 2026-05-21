"use client";

import { useState, useTransition } from "react";
import { createPortalUserOrInviteAction } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { creatableRoles } from "@/lib/validations/users";
import { roleLabels } from "@/lib/constants/roles";

export type LinkableRecord = { id: string; displayName: string; hasAccount: boolean };

export function CreateUserForm({
  adminKeyConfigured,
  emailProviderConfigured,
  linkableTechnicians,
  linkableDoctors,
}: {
  adminKeyConfigured: boolean;
  emailProviderConfigured: boolean;
  linkableTechnicians: LinkableRecord[];
  linkableDoctors: LinkableRecord[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string; mode?: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [usePassword, setUsePassword] = useState(adminKeyConfigured);
  const [sendEmail, setSendEmail] = useState(emailProviderConfigured);

  function submit(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await createPortalUserOrInviteAction(fd);
      setResult(res);
    });
  }

  const showTechnicianLink = selectedRole === "technician";
  const showDoctorLink = selectedRole === "doctor";
  const unlinkedTechs = linkableTechnicians.filter((t) => !t.hasAccount);
  const unlinkedDoctors = linkableDoctors.filter((d) => !d.hasAccount);

  // ── Blocked state ──────────────────────────────────────────────────────
  if (!adminKeyConfigured) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Server admin key not configured
          </p>
          <p className="text-amber-700 dark:text-amber-400">
            Add{" "}
            <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 font-mono text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            to your{" "}
            <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 font-mono text-xs">
              .env.local
            </code>{" "}
            to enable direct account creation. You can still save invitation records — the user
            will need to be created manually in Supabase Dashboard.
          </p>
        </div>

        {/* Allow saving an invite record even without admin key */}
        <InviteRecordForm
          onSubmit={submit}
          isPending={isPending}
          result={result}
          emailProviderConfigured={emailProviderConfigured}
          linkableTechnicians={unlinkedTechs}
          linkableDoctors={unlinkedDoctors}
        />
      </div>
    );
  }

  // ── Full form ──────────────────────────────────────────────────────────
  return (
    <form action={submit} className="space-y-5">
      {/* Core identity */}
      <Card>
        <CardHeader><CardTitle>User identity</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" name="fullName" placeholder="Dr. Sara Ahmed" required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="sara@clinic.ae" required />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role */}
      <Card>
        <CardHeader><CardTitle>Role &amp; access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              id="role"
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="">— Select role —</option>
              {creatableRoles.map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              lab_owner and super_admin cannot be assigned here — contact your Supabase project admin.
            </p>
          </div>

          {/* Technician link */}
          {showTechnicianLink && (
            <div className="grid gap-2">
              <Label htmlFor="linkedRecordId">Link to technician record</Label>
              <Select id="linkedRecordId" name="linkedRecordId" defaultValue="">
                <option value="">— No link (link later from technician edit page) —</option>
                {unlinkedTechs.map((t) => (
                  <option key={t.id} value={t.id}>{t.displayName}</option>
                ))}
              </Select>
              <input type="hidden" name="linkedRecordType" value="technician" />
            </div>
          )}

          {/* Doctor link */}
          {showDoctorLink && (
            <div className="grid gap-2">
              <Label htmlFor="linkedRecordId">Link to doctor record</Label>
              <Select id="linkedRecordId" name="linkedRecordId" defaultValue="">
                <option value="">— No link (link later from doctor edit page) —</option>
                {unlinkedDoctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.displayName}</option>
                ))}
              </Select>
              <input type="hidden" name="linkedRecordType" value="doctor" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input name="isActive" type="checkbox" defaultChecked value="true" className="h-4 w-4 rounded border" />
            Activate account immediately
          </label>
        </CardContent>
      </Card>

      {/* Password / mode */}
      <Card>
        <CardHeader><CardTitle>Account creation method</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="_createMode"
                value="direct"
                checked={usePassword}
                onChange={() => setUsePassword(true)}
                className="h-4 w-4"
              />
              <span>
                <span className="font-medium">Create account now</span>
                <span className="block text-xs text-muted-foreground">Set a temporary password</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="_createMode"
                value="invite"
                checked={!usePassword}
                onChange={() => setUsePassword(false)}
                className="h-4 w-4"
              />
              <span>
                <span className="font-medium">Save invite record only</span>
                <span className="block text-xs text-muted-foreground">Create the auth user later</span>
              </span>
            </label>
          </div>

          {usePassword && (
            <div className="grid gap-2">
              <Label htmlFor="temporaryPassword">Temporary password *</Label>
              <Input
                id="temporaryPassword"
                name="temporaryPassword"
                type="password"
                placeholder="Min 10 chars with letters and numbers"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Share this securely (in person or encrypted message). The user should change it on
                first login. Never send passwords via email.
              </p>
            </div>
          )}

          {/* Send email notification */}
          <div className="space-y-1.5">
            <label
              className={`flex items-start gap-2 text-sm ${!emailProviderConfigured ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input
                name="sendEmail"
                type="checkbox"
                value="on"
                checked={sendEmail && emailProviderConfigured}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={!emailProviderConfigured}
                className="h-4 w-4 rounded border mt-0.5 shrink-0"
              />
              <span>
                <span className="font-medium">
                  {usePassword ? "Send account-ready notification" : "Send invite email"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {usePassword
                    ? "Notifies the user their account is ready (does not include the password)"
                    : "Sends the invite link with accept URL and expiry"}
                </span>
              </span>
            </label>
            {!emailProviderConfigured && (
              <p className="text-xs text-muted-foreground pl-6">
                Add{" "}
                <code className="rounded bg-muted px-0.5 font-mono text-xs">RESEND_API_KEY</code>
                {" + "}
                <code className="rounded bg-muted px-0.5 font-mono text-xs">EMAIL_FROM</code>
                {" "}to enable email sending.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            placeholder="e.g. Technician for morning shift — clinic B"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Result feedback */}
      {result && (
        <div className={`rounded-lg border p-4 text-sm ${result.ok ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-destructive/30 bg-destructive/5"}`}>
          <p className={result.ok ? "font-medium text-green-800 dark:text-green-300" : "text-destructive"}>
            {result.message}
          </p>
          {result.ok && result.mode === "direct" && (
            <ul className="mt-2 space-y-1 text-xs text-green-700 dark:text-green-400">
              <li>✓ Auth account created</li>
              <li>✓ Role assigned</li>
              <li>✓ Profile activated</li>
              <li>⚠ Share temporary password securely — user must change it on first login</li>
            </ul>
          )}
          {result.ok && result.mode === "invite_only" && (
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              Next step: Create their Supabase Auth account with this email and give them the link.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : usePassword ? "Create account" : "Save invite record"}
        </Button>
      </div>
    </form>
  );
}

// ── Minimal invite-record form (shown when admin key is missing) ──────────

function InviteRecordForm({
  onSubmit,
  isPending,
  result,
  emailProviderConfigured,
  linkableTechnicians,
  linkableDoctors,
}: {
  onSubmit: (fd: FormData) => void;
  isPending: boolean;
  result: { ok: boolean; message: string } | null;
  emailProviderConfigured: boolean;
  linkableTechnicians: LinkableRecord[];
  linkableDoctors: LinkableRecord[];
}) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [sendEmail, setSendEmail] = useState(emailProviderConfigured);
  const showTechnicianLink = selectedRole === "technician";
  const showDoctorLink = selectedRole === "doctor";

  return (
    <form action={onSubmit} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Save invite record</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" name="fullName" required placeholder="Sara Ahmed" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="sara@clinic.ae" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                id="role"
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
              >
                <option value="">— Select role —</option>
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </Select>
            </div>
            {showTechnicianLink && linkableTechnicians.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="linkedRecordId">Link to technician</Label>
                <Select id="linkedRecordId" name="linkedRecordId" defaultValue="">
                  <option value="">— Optional —</option>
                  {linkableTechnicians.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                </Select>
                <input type="hidden" name="linkedRecordType" value="technician" />
              </div>
            )}
            {showDoctorLink && linkableDoctors.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="linkedRecordId">Link to doctor</Label>
                <Select id="linkedRecordId" name="linkedRecordId" defaultValue="">
                  <option value="">— Optional —</option>
                  {linkableDoctors.map((d) => <option key={d.id} value={d.id}>{d.displayName}</option>)}
                </Select>
                <input type="hidden" name="linkedRecordType" value="doctor" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send invite email */}
      <label
        className={`flex items-start gap-2 text-sm ${!emailProviderConfigured ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          name="sendEmail"
          type="checkbox"
          value="on"
          checked={sendEmail && emailProviderConfigured}
          onChange={(e) => setSendEmail(e.target.checked)}
          disabled={!emailProviderConfigured}
          className="h-4 w-4 rounded border mt-0.5 shrink-0"
        />
        <span>
          <span className="font-medium">Send invite email</span>
          <span className="block text-xs text-muted-foreground">
            {emailProviderConfigured
              ? "Sends an invite link to the user"
              : "Requires RESEND_API_KEY + EMAIL_FROM in .env.local"}
          </span>
        </span>
      </label>

      {result && (
        <p className={`text-sm rounded-md px-3 py-2 ${result.ok ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300" : "bg-destructive/10 text-destructive"}`}>
          {result.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone="amber">Admin key missing</Badge>
          <Badge tone="neutral">Invite record only</Badge>
        </div>
        <Button type="submit" disabled={isPending} variant="outline">
          {isPending ? "Saving…" : "Save invite record"}
        </Button>
      </div>
    </form>
  );
}
