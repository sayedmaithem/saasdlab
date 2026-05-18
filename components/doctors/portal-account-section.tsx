"use client";

import { useState, useTransition } from "react";
import {
  linkDoctorPortalAccountAction,
  unlinkDoctorPortalAccountAction,
} from "@/app/actions/portal-accounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  doctorId: string;
  profileId: string | null;
  canManage: boolean;
}

export function DoctorPortalAccountSection({ doctorId, profileId, canManage }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showUnlink, setShowUnlink] = useState(false);

  function handleLink(formData: FormData) {
    startTransition(async () => {
      const result = await linkDoctorPortalAccountAction(formData);
      setMessage({ text: result.message, ok: result.ok });
    });
  }

  function handleUnlink(formData: FormData) {
    startTransition(async () => {
      const result = await unlinkDoctorPortalAccountAction(formData);
      setMessage({ text: result.message, ok: result.ok });
      if (result.ok) setShowUnlink(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Doctor portal account</CardTitle>
          {profileId ? (
            <Badge tone="green">Active</Badge>
          ) : (
            <Badge tone="neutral">Not linked</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profileId ? (
          // ── Linked state ──────────────────────────────────────────
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                This doctor has a portal account. They can log in to view their cases, approve
                designs, and communicate with your lab.
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                User ID: {profileId}
              </p>
            </div>

            {canManage && (
              <>
                {!showUnlink ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnlink(true)}
                    disabled={isPending}
                  >
                    Revoke portal access
                  </Button>
                ) : (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-destructive">
                      Revoke doctor portal access?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The doctor will no longer be able to log in. Their Supabase auth account is
                      preserved — delete it from the dashboard if needed.
                    </p>
                    <div className="flex gap-2">
                      <form action={handleUnlink}>
                        <input type="hidden" name="doctorId" value={doctorId} />
                        <input type="hidden" name="userId" value={profileId} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                        >
                          {isPending ? "Revoking…" : "Yes, revoke access"}
                        </Button>
                      </form>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUnlink(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // ── Unlinked state ─────────────────────────────────────────
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No portal account linked. Link one so this doctor can log in to view their cases and
              approve designs.
            </p>

            {canManage ? (
              <>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">How to link an account</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Go to your{" "}
                      <span className="font-medium">Supabase project → Authentication → Users</span>
                    </li>
                    <li>Click <span className="font-medium">Add user</span> and create the account</li>
                    <li>Copy the <span className="font-medium">User UID</span></li>
                    <li>Paste it below and click <span className="font-medium">Link account</span></li>
                  </ol>
                </div>

                <form action={handleLink} className="space-y-3">
                  <input type="hidden" name="doctorId" value={doctorId} />
                  <div>
                    <Label htmlFor="dp-user-id">User UID (from Supabase)</Label>
                    <Input
                      id="dp-user-id"
                      name="userId"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      required
                      pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                      title="Must be a valid UUID"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dp-full-name">Full name (optional override)</Label>
                    <Input
                      id="dp-full-name"
                      name="fullName"
                      placeholder="Leave blank to keep existing profile name"
                    />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Linking…" : "Link account"}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact a lab owner to set up portal access for this doctor.
              </p>
            )}
          </div>
        )}

        {message ? (
          <p className={`text-sm ${message.ok ? "text-green-700" : "text-destructive"}`}>
            {message.text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
