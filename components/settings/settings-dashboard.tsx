"use client";

import { useState, useTransition } from "react";
import { updateLabSettingsAction } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsData } from "@/lib/data/settings";

export function SettingsDashboard({ data }: { data: SettingsData }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateLabSettingsAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Administration</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Lab profile</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={data.lab.name} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input name="phone" defaultValue={data.lab.phone ?? ""} /></div>
            <div className="grid gap-2"><Label>Address</Label><Input name="address" defaultValue={data.lab.address ?? ""} /></div>
            <div className="grid gap-2"><Label>Currency</Label><Input name="currency" defaultValue={data.lab.currency} /></div>
            <div className="grid gap-2"><Label>Timezone</Label><Input name="timezone" defaultValue={data.lab.timezone} /></div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-muted-foreground">Logo upload placeholder. {message ?? ""}</p>
              <Button type="submit" disabled={isPending}>Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard title="Work types" rows={data.workTypes.map((item) => [item, "Active"])} />
        <ListCard title="Materials" rows={data.materials.map((item) => [item.name, `$${item.defaultPrice}`, item.active ? "Active" : "Inactive"])} />
        <ListCard title="QC checklist settings" rows={data.qcSettings.map((item) => [item.workType, item.item, item.required ? "Required" : "Optional", item.active ? "Active" : "Inactive"])} />
        <Card>
          <CardHeader><CardTitle>User management</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{user.name}</span>
                <Badge tone="neutral">{user.role ?? "unassigned"}</Badge>
              </div>
            ))}
            <p className="text-muted-foreground">Invite user TODO. Notification settings TODO: WhatsApp, email, in-app routing.</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>RTL readiness</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          UI labels are prepared for translation constants and the layout uses logical spacing patterns that can support RTL direction later.
        </CardContent>
      </Card>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="flex flex-wrap gap-2 rounded-md border p-3">
            {row.map((cell) => <Badge key={cell} tone="neutral">{cell}</Badge>)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
