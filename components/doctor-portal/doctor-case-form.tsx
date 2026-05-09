"use client";

import { useState, useTransition } from "react";
import { createDoctorPortalCaseAction } from "@/app/actions/doctor-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DoctorCaseForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createDoctorPortalCaseAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>New case</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>Patient name</Label><Input name="patientName" required /></div>
          <div className="grid gap-2"><Label>Work type</Label><Select name="workType" required><option>Zircon Crown</option><option>Emax</option><option>Implant</option><option>Night Guard</option></Select></div>
          <Input name="material" placeholder="Material" />
          <Input name="shade" placeholder="Shade" />
          <Input name="toothNumbers" placeholder="Tooth numbers" />
          <Input name="unitsCount" type="number" min="1" defaultValue="1" />
          <Input name="dueDate" type="date" />
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input name="isUrgent" type="checkbox" /> Urgent</label>
          <Textarea name="notes" placeholder="Notes for the lab" className="md:col-span-2" />
          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <p className="text-sm text-muted-foreground">After creation you can upload STL/photos from the case detail page. {message ?? ""}</p>
            <Button type="submit" disabled={isPending}>Create case</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
