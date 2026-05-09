"use client";

import { useState, useTransition } from "react";
import { upsertClinicAction } from "@/app/actions/clinics";
import type { ActionState } from "@/app/actions/doctors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicListItem } from "@/lib/data/clinics";

export function ClinicsManager({
  clinics,
  canManage,
}: {
  clinics: ClinicListItem[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setState(await upsertClinicAction(formData));
    });
  }

  return (
    <div className="space-y-5">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Create clinic</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Clinic name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>
              <div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Create clinic"}
                </Button>
              </div>
            </form>
            {state ? (
              <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Clinics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{clinic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {clinic.phone ?? clinic.email ?? "No contact"}
                  </p>
                </div>
                <Badge tone={clinic.isActive ? "green" : "neutral"}>
                  {clinic.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {clinic.address ?? "No address set"}
              </p>
              <p className="mt-3 text-sm font-medium">
                {clinic.doctorsCount} linked doctors
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
