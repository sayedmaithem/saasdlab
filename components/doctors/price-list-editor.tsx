"use client";

import { useState, useTransition } from "react";
import { upsertDoctorPriceAction, type ActionState } from "@/app/actions/doctors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DoctorPriceItem } from "@/lib/data/doctors";

export function PriceListEditor({
  doctorId,
  prices,
}: {
  doctorId: string;
  prices: DoctorPriceItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setState(await upsertDoctorPriceAction(formData));
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Add price</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-4 md:grid-cols-5">
            <input type="hidden" name="doctorId" value={doctorId} />
            <div>
              <Label htmlFor="workType">Work type</Label>
              <Input id="workType" name="workType" required />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input id="material" name="material" />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit price</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="effectiveFrom">Effective date</Label>
              <Input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>
              <Button type="submit" disabled={isPending}>
                Save
              </Button>
            </div>
          </form>
          {state ? (
            <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor-specific prices</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-normal text-muted-foreground">
                <th className="py-3">Work type</th>
                <th className="py-3">Material</th>
                <th className="py-3">Unit price</th>
                <th className="py-3">Effective</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{item.workType}</td>
                  <td className="py-3">{item.material ?? "Any"}</td>
                  <td className="py-3">${item.unitPrice}</td>
                  <td className="py-3">{item.effectiveFrom}</td>
                  <td className="py-3">{item.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
