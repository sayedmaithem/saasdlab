"use client";

import { useState, useTransition } from "react";
import { createDoctorAction, type ActionState } from "@/app/actions/doctors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicOption } from "@/lib/data/doctors";

export function NewDoctorForm({ clinics }: { clinics: ClinicOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setState(await createDoctorAction(formData));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create doctor</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required />
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
              <Label htmlFor="clinicId">Clinic</Label>
              <Select id="clinicId" name="clinicId">
                <option value="">No default clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment terms</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                placeholder="Net 30, weekly, prepaid..."
              />
            </div>
            <div>
              <Label htmlFor="defaultPriceGroup">Default price group</Label>
              <Input
                id="defaultPriceGroup"
                name="defaultPriceGroup"
                placeholder="Standard, VIP, implant..."
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input name="isVip" type="checkbox" className="size-4" />
            VIP doctor
          </label>
          {state ? (
            <p
              className={
                state.ok
                  ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
                  : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
              }
            >
              {state.message}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Create doctor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
