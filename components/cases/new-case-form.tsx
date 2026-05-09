"use client";

import { useState, useTransition } from "react";
import {
  createCaseAction,
  type CreateCaseActionState,
} from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SelectOption } from "@/lib/types";

export function NewCaseForm({
  doctors,
  clinics,
}: {
  doctors: SelectOption[];
  clinics: SelectOption[];
  source: "supabase" | "preview";
}) {
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<CreateCaseActionState | null>(
    null,
  );

  function submit(formData: FormData) {
    startTransition(async () => {
      setActionState(await createCaseAction(formData));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register production case</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="doctorId">Doctor</Label>
              <Select id="doctorId" name="doctorId" required>
                <option value="">Choose doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.value} value={doctor.value}>
                    {doctor.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="clinicId">Clinic</Label>
              <Select id="clinicId" name="clinicId" required>
                <option value="">Choose clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.value} value={clinic.value}>
                    {clinic.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="patientName">Patient name</Label>
              <Input id="patientName" name="patientName" required />
            </div>
            <div>
              <Label htmlFor="workType">Work type</Label>
              <Select id="workType" name="workType" required>
                <option value="zircon_crown">Zircon Crown</option>
                <option value="emax">Emax</option>
                <option value="implant">Implant</option>
                <option value="night_guard">Night Guard</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input id="material" name="material" placeholder="Zirconia, Emax..." />
            </div>
            <div>
              <Label htmlFor="shade">Shade</Label>
              <Input id="shade" name="shade" placeholder="A2, BL2..." />
            </div>
            <div>
              <Label htmlFor="unitsCount">Units count</Label>
              <Input
                id="unitsCount"
                name="unitsCount"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </div>
            <div>
              <Label htmlFor="toothNumbers">Tooth numbers</Label>
              <Input id="toothNumbers" name="toothNumbers" placeholder="11, 12, 21" />
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div>
              <Label htmlFor="complexity">Complexity</Label>
              <Select id="complexity" name="complexity" defaultValue="standard">
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="implantSystem">Implant system</Label>
              <Input id="implantSystem" name="implantSystem" />
            </div>
            <div>
              <Label htmlFor="scanBodyInfo">Scan body info</Label>
              <Input id="scanBodyInfo" name="scanBodyInfo" />
            </div>
            <div>
              <Label htmlFor="biteInfo">Bite info</Label>
              <Input id="biteInfo" name="biteInfo" />
            </div>
            <div>
              <Label htmlFor="arch">Arch</Label>
              <Select id="arch" name="arch">
                <option value="">Not applicable</option>
                <option value="upper">Upper</option>
                <option value="lower">Lower</option>
                <option value="both">Both</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["isUrgent", "Urgent"],
              ["isRemake", "Remake"],
              ["isWarranty", "Warranty"],
              ["requiresDoctorApproval", "Requires doctor approval"],
              ["physicalImpressionReceived", "Physical impression received"],
              ["preparationPhotoReceived", "Preparation photo received"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm font-medium">
                <input name={name} type="checkbox" className="size-4" />
                {label}
              </label>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Doctor instructions, occlusion notes, try-in expectations..."
            />
          </div>

          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">Initial file uploads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional cloud uploads are handled from the case files section
              after the case is created. This keeps storage metadata and RLS
              paths tied to a real case id.
            </p>
          </div>

          {actionState ? (
            <p
              className={
                actionState.ok
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
                  : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
              }
            >
              {actionState.message}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create case"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
