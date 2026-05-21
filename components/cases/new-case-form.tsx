"use client";

import { useState, useTransition, useMemo } from "react";
import {
  createCaseAction,
  type CreateCaseActionState,
} from "@/app/actions/cases";
import { ToothChart } from "@/components/cases/tooth-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DoctorOption, CatalogOption } from "@/lib/data/dashboard";
import type { SelectOption } from "@/lib/types";

export function NewCaseForm({
  doctors,
  clinics,
  operations = [],
  materials = [],
}: {
  doctors: DoctorOption[];
  clinics: SelectOption[];
  operations?: CatalogOption[];
  materials?: SelectOption[];
  source: "supabase" | "preview";
}) {
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<CreateCaseActionState | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [arch, setArch] = useState<string>("");
  const [selectedOperationId, setSelectedOperationId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

  const hasCatalogOperations = operations.length > 0;
  const hasCatalogMaterials = materials.length > 0;

  const selectedOperation = operations.find((o) => o.value === selectedOperationId);

  const filteredDoctors = useMemo(() => {
    if (!selectedClinicId) return doctors;
    const matched = doctors.filter((d) => d.clinicId === selectedClinicId);
    return matched.length > 0 ? matched : doctors;
  }, [doctors, selectedClinicId]);

  const noClinicDoctors = selectedClinicId
    ? doctors.filter((d) => d.clinicId === selectedClinicId).length === 0
    : false;

  function submit(formData: FormData) {
    formData.set("toothNumbers", selectedTeeth.join(", "));
    // If catalog operation selected, use its name as workType and store its ID
    if (selectedOperationId) {
      const op = operations.find((o) => o.value === selectedOperationId);
      if (op) formData.set("workType", op.label);
      formData.set("operationId", selectedOperationId);
    }
    // If catalog material selected, use its name as material and store its ID
    if (selectedMaterialId) {
      const mat = materials.find((m) => m.value === selectedMaterialId);
      if (mat) formData.set("material", mat.label);
      formData.set("materialId", selectedMaterialId);
    }
    startTransition(async () => {
      setActionState(await createCaseAction(formData));
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Register production case</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="space-y-6">

            {/* ─── CLINIC + DOCTOR ─────────────────────── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Doctor & clinic
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="clinicId">Clinic</Label>
                  <Select
                    id="clinicId"
                    name="clinicId"
                    required
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                  >
                    <option value="">Choose clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.value} value={clinic.value}>
                        {clinic.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="doctorId">
                    Doctor
                    {selectedClinicId && !noClinicDoctors && (
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        (filtered by clinic)
                      </span>
                    )}
                  </Label>
                  {noClinicDoctors ? (
                    <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      No doctors assigned to this clinic. Showing all doctors.
                    </p>
                  ) : null}
                  <Select id="doctorId" name="doctorId" required>
                    <option value="">Choose doctor</option>
                    {filteredDoctors.map((doctor) => (
                      <option key={doctor.value} value={doctor.value}>
                        {doctor.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* ─── PATIENT & WORK TYPE ─────────────────── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Case details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="patientName">Patient name</Label>
                  <Input id="patientName" name="patientName" required />
                </div>
                <div>
                  <Label htmlFor="workType">
                    Work type
                    {hasCatalogOperations ? (
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        (from catalog)
                      </span>
                    ) : null}
                  </Label>
                  {hasCatalogOperations ? (
                    <Select
                      id="workType"
                      name="workType"
                      value={selectedOperationId}
                      onChange={(e) => setSelectedOperationId(e.target.value)}
                      required
                    >
                      <option value="">Choose operation</option>
                      {operations.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Select id="workType" name="workType" required>
                      <option value="zircon_crown">Zircon Crown</option>
                      <option value="emax">Emax</option>
                      <option value="implant">Implant</option>
                      <option value="night_guard">Night Guard</option>
                      <option value="other">Other</option>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="material">
                    Material
                    {hasCatalogMaterials ? (
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        (from catalog)
                      </span>
                    ) : null}
                  </Label>
                  {hasCatalogMaterials ? (
                    <Select
                      id="material"
                      name="material"
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                    >
                      <option value="">Any material</option>
                      {materials.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input id="material" name="material" placeholder="Zirconia, Emax..." />
                  )}
                </div>
                <div>
                  <Label htmlFor="shade">Shade</Label>
                  <Input id="shade" name="shade" placeholder="A2, BL2..." />
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
              </div>
            </div>

            {/* ─── ARCH SELECTION ──────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Arch selection
              </h3>
              <div className="flex flex-wrap gap-3">
                {(["upper", "lower", "both"] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      arch === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="arch"
                      value={value}
                      checked={arch === value}
                      onChange={() => setArch(value)}
                      className="sr-only"
                    />
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* ─── TOOTH CHART ─────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Tooth selection (FDI notation)
                </h3>
                <div className="flex items-center gap-3">
                  {selectedTeeth.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTeeth([])}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {selectedTeeth.length} selected · {selectedTeeth.length} unit{selectedTeeth.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ToothChart selected={selectedTeeth} onChange={setSelectedTeeth} />
              {/* hidden field — populated on submit */}
              <input type="hidden" name="toothNumbers" value={selectedTeeth.join(", ")} />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="unitsCount">Units count</Label>
                  <Input
                    id="unitsCount"
                    name="unitsCount"
                    type="number"
                    min={1}
                    value={
                      selectedTeeth.length > 0
                        ? selectedTeeth.length
                        : selectedOperation?.defaultUnits ?? undefined
                    }
                    defaultValue={1}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ─── IMPLANT / SCAN DETAILS ──────────────── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Implant / scan details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </div>

            {/* ─── FLAGS ───────────────────────────────── */}
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
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

            {/* ─── NOTES ───────────────────────────────── */}
            <div>
              <Label htmlFor="notes">Clinical notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Doctor instructions, occlusion notes, try-in expectations..."
              />
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

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Creating..." : "Create case"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
