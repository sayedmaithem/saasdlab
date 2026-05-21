"use client";

import { useState, useTransition } from "react";
import { upsertPortalAccessTemplateAction } from "@/app/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PortalAccessTemplate } from "@/lib/data/master-data";

const APP_ROLES = [
  "super_admin",
  "lab_owner",
  "lab_manager",
  "accountant",
  "reception",
  "technician",
  "delivery",
  "doctor",
] as const;

export function PortalAccessManager({
  templates,
  canManage,
}: {
  templates: PortalAccessTemplate[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    // Inject empty permissions JSON
    formData.set("permissions", "{}");
    startTransition(async () => {
      const result = await upsertPortalAccessTemplateAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Portal access templates define which role can access which portal area. The permission
        content engine (fine-grained JSONB permissions) is planned for a future phase. Templates
        created here record the role and intent — they can be populated programmatically later.
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Create template</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="templateId" value="" />
              <div>
                <Label htmlFor="pa-name">Template name</Label>
                <Input
                  id="pa-name"
                  name="name"
                  placeholder="e.g. Doctor read-only portal"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pa-role">Role</Label>
                <Select id="pa-role" name="role" defaultValue="">
                  <option value="" disabled>
                    Select role
                  </option>
                  {APP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pa-desc">Description (optional)</Label>
                <Input
                  id="pa-desc"
                  name="description"
                  placeholder="What this template grants access to"
                />
              </div>
              <div className="flex items-center gap-2">
                <input name="isDefault" type="checkbox" id="pa-default" />
                <Label htmlFor="pa-default">Default for this role</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save template"}
                </Button>
              </div>
            </form>
            {message ? (
              <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            Templates{" "}
            <span className="font-normal text-muted-foreground">({templates.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No portal access templates created yet.
            </p>
          ) : (
            <div className="divide-y">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{tpl.name}</p>
                    {tpl.description ? (
                      <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="neutral">{tpl.role}</Badge>
                    {tpl.isDefault ? <Badge tone="blue">Default</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
