"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertTechnicianAction } from "@/app/actions/technicians";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Technician } from "@/lib/data/technicians";

export function TechnicianForm({ technician }: { technician?: Technician }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const isEdit = Boolean(technician);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertTechnicianAction(formData);
      if (result.ok) {
        router.push("/technicians");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit technician" : "Add technician"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-5">
          {technician ? (
            <input type="hidden" name="technicianId" value={technician.id} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="displayName">Full name *</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                minLength={2}
                defaultValue={technician?.displayName ?? ""}
                placeholder="Technician name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={technician?.phone ?? ""}
                placeholder="07xx xxx xxxx"
              />
            </div>

            <div>
              <Label htmlFor="employmentStatus">Status</Label>
              <Select
                id="employmentStatus"
                name="employmentStatus"
                defaultValue={technician?.employmentStatus ?? "active"}
              >
                <option value="active">Active</option>
                <option value="contractor">Contractor</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                name="skills"
                defaultValue={technician?.skills.map((s) => s.skill).join(", ") ?? ""}
                placeholder="zirconia, emax, implant, cad design..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used for workload routing and skill matching on production cards.
              </p>
            </div>
          </div>

          {message ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {message}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create technician"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
