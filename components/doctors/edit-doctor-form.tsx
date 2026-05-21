"use client";

import { useState, useTransition } from "react";
import { updateDoctorAction, type ActionState } from "@/app/actions/doctors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicOption } from "@/lib/data/doctors";
import type { PriceGroup } from "@/lib/data/master-data";

export type DoctorEditData = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  defaultClinicId: string | null;
  isActive: boolean;
  isVip: boolean;
  address: string | null;
  notes: string | null;
  paymentTerms: string | null;
  defaultPriceGroup: string | null;
  clinics: ClinicOption[];
};

export function EditDoctorForm({
  doctor,
  priceGroups = [],
}: {
  doctor: DoctorEditData;
  priceGroups?: PriceGroup[];
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setState(await updateDoctorAction(formData));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit doctor</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-5">
          <input type="hidden" name="doctorId" value={doctor.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                defaultValue={doctor.displayName}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={doctor.phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={doctor.email ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="clinicId">Clinic</Label>
              <Select
                id="clinicId"
                name="clinicId"
                defaultValue={doctor.defaultClinicId ?? ""}
              >
                <option value="">No default clinic</option>
                {doctor.clinics.map((clinic) => (
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
                defaultValue={doctor.paymentTerms ?? ""}
                placeholder="Net 30, weekly, prepaid..."
              />
            </div>
            <div>
              <Label htmlFor="defaultPriceGroup">Default price group</Label>
              <Select
                id="defaultPriceGroup"
                name="defaultPriceGroup"
                defaultValue={doctor.defaultPriceGroup ?? ""}
              >
                <option value="">No price group</option>
                {priceGroups.filter((g) => g.isActive).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={doctor.address ?? ""} />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={doctor.notes ?? ""} />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="isVip"
                type="checkbox"
                className="size-4"
                defaultChecked={doctor.isVip}
              />
              VIP doctor
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="isActive"
                type="checkbox"
                className="size-4"
                defaultChecked={doctor.isActive}
              />
              Active
            </label>
          </div>

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
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
