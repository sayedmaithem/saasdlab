"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
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
import { createCaseSchema, type CreateCaseInput } from "@/lib/validations/case";
import type { SelectOption } from "@/lib/types";

const defaultValues = {
  patientDisplay: "",
  doctorId: "",
  clinicId: "",
  restorationType: "",
  shade: "",
  toothNumbers: "",
  dueDate: "",
  priority: "normal" as const,
  notes: "",
};

function fieldMessage(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function NewCaseForm({
  doctors,
  clinics,
  source,
}: {
  doctors: SelectOption[];
  clinics: SelectOption[];
  source: "supabase" | "preview";
}) {
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<CreateCaseActionState | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues,
  });

  function onSubmit(values: CreateCaseInput) {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.set(key, value.join(","));
      } else {
        formData.set(key, value ?? "");
      }
    });

    startTransition(async () => {
      const result = await createCaseAction(formData);
      setActionState(result);

      if (result.ok) {
        reset(defaultValues);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register production case</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="patientDisplay">Patient display</Label>
              <Input
                id="patientDisplay"
                placeholder="Initials or approved display name"
                {...register("patientDisplay")}
              />
              {fieldMessage(errors.patientDisplay?.message)}
            </div>
            <div>
              <Label htmlFor="restorationType">Restoration type</Label>
              <Input
                id="restorationType"
                placeholder="Zirconia crown, implant bridge..."
                {...register("restorationType")}
              />
              {fieldMessage(errors.restorationType?.message)}
            </div>
            <div>
              <Label htmlFor="doctorId">Doctor</Label>
              <Select id="doctorId" {...register("doctorId")}>
                <option value="">Choose doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.value} value={doctor.value}>
                    {doctor.label}
                  </option>
                ))}
              </Select>
              {fieldMessage(errors.doctorId?.message)}
            </div>
            <div>
              <Label htmlFor="clinicId">Clinic</Label>
              <Select id="clinicId" {...register("clinicId")}>
                <option value="">Choose clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.value} value={clinic.value}>
                    {clinic.label}
                  </option>
                ))}
              </Select>
              {fieldMessage(errors.clinicId?.message)}
            </div>
            <div>
              <Label htmlFor="toothNumbers">Tooth numbers</Label>
              <Input
                id="toothNumbers"
                placeholder="11, 12, 21"
                {...register("toothNumbers")}
              />
              {fieldMessage(errors.toothNumbers?.message)}
            </div>
            <div>
              <Label htmlFor="shade">Shade</Label>
              <Input id="shade" placeholder="A2, BL2..." {...register("shade")} />
              {fieldMessage(errors.shade?.message)}
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {fieldMessage(errors.dueDate?.message)}
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" {...register("priority")}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
              {fieldMessage(errors.priority?.message)}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Clinical notes</Label>
            <Textarea
              id="notes"
              placeholder="Bite notes, doctor instructions, try-in expectations..."
              {...register("notes")}
            />
            {fieldMessage(errors.notes?.message)}
          </div>

          {source === "preview" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              Preview mode: validation runs locally, but insert is blocked until
              Supabase env vars and the migration are configured.
            </p>
          ) : null}

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
            <PlusCircle aria-hidden="true" />
            {isPending ? "Creating..." : "Create case"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
