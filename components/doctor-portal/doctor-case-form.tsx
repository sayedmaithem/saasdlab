"use client";

import { useState, useTransition } from "react";
import { createDoctorPortalCaseAction } from "@/app/actions/doctor-portal";
import { ToothChart } from "@/components/cases/tooth-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DoctorPortalFormData } from "@/lib/data/doctor-portal";

export function DoctorCaseForm({ formData }: { formData: DoctorPortalFormData }) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

  // Derived
  const selectedMaterial = formData.materials.find((m) => m.id === selectedMaterialId);
  const selectedOperation = formData.operations.find((o) => o.id === selectedOperationId);
  const needsShade = selectedMaterial?.shadeRequired ?? false;

  // Pre-select the only clinic when there's exactly one
  const defaultClinicId =
    formData.clinics.length === 1
      ? formData.clinics[0].id
      : (formData.defaultClinicId ?? "");

  // ── Not linked yet ────────────────────────────────────────────────────────
  if (!formData.doctorId) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Portal account not linked</p>
          <p className="text-sm text-muted-foreground">
            Ask your lab administrator to link your account to a doctor profile before you can
            submit cases.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Catalog not configured ─────────────────────────────────────────────
  if (formData.operations.length === 0 && formData.materials.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-base font-medium text-foreground">Lab catalog not set up yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The lab has not yet configured its work types and materials list. Please contact the
            lab — they will be able to accept your case once the catalog is ready.
          </p>
        </CardContent>
      </Card>
    );
  }

  function submit(fd: FormData) {
    // Inject controlled state into the form data before sending
    fd.set("toothNumbers", selectedTeeth.join(", "));

    if (selectedOperationId) {
      fd.set("operationId", selectedOperationId);
      if (selectedOperation) fd.set("workType", selectedOperation.name);
    }
    if (selectedMaterialId) {
      fd.set("materialId", selectedMaterialId);
      if (selectedMaterial) fd.set("material", selectedMaterial.name);
    }

    setErrorMessage(null);
    startTransition(async () => {
      // On success: server redirects to /doctor-portal and never returns here.
      // On failure: returns { ok: false, message }.
      const result = await createDoctorPortalCaseAction(fd);
      setErrorMessage(result.message);
    });
  }

  // ── Form — wraps both sections so all fields are submitted ────────────────
  return (
    <form action={submit} className="space-y-5">
      {/* ── Patient & clinic ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Patient &amp; clinic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Patient name */}
            <div className="grid gap-2">
              <Label htmlFor="patientName">Patient name *</Label>
              <Input
                id="patientName"
                name="patientName"
                placeholder="Full name"
                required
                autoFocus
              />
            </div>

            {/* Clinic */}
            <div className="grid gap-2">
              <Label htmlFor="clinicId">Clinic *</Label>
              {formData.clinics.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-md border px-3 py-2 h-10 flex items-center">
                  No clinic linked — ask your lab to assign a clinic.
                </p>
              ) : formData.clinics.length === 1 ? (
                <>
                  {/* Hidden field so the single clinic is always submitted */}
                  <input type="hidden" name="clinicId" value={formData.clinics[0].id} />
                  <p className="text-sm rounded-md border px-3 py-2 h-10 flex items-center">
                    {formData.clinics[0].name}
                  </p>
                </>
              ) : (
                <Select id="clinicId" name="clinicId" defaultValue={defaultClinicId} required>
                  <option value="">— Select clinic —</option>
                  {formData.clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Due date */}
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>

            {/* Urgent */}
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input name="isUrgent" type="checkbox" className="h-4 w-4 rounded border" />
                Mark as urgent
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Restoration ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Restoration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Operation */}
            <div className="grid gap-2">
              <Label htmlFor="operationId">
                Operation{formData.operations.length > 0 ? " *" : ""}
              </Label>
              {formData.operations.length > 0 ? (
                <Select
                  id="operationId"
                  value={selectedOperationId}
                  onChange={(e) => setSelectedOperationId(e.target.value)}
                  required
                >
                  <option value="">— Select operation —</option>
                  {formData.operations.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.category ? `${op.category} — ` : ""}
                      {op.name}
                      {op.code ? ` (${op.code})` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input name="workType" placeholder="e.g. Zircon Crown" required />
              )}
            </div>

            {/* Material */}
            <div className="grid gap-2">
              <Label htmlFor="materialId">Material</Label>
              {formData.materials.length > 0 ? (
                <Select
                  id="materialId"
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                >
                  <option value="">— Select material (optional) —</option>
                  {formData.materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name}
                      {mat.code ? ` (${mat.code})` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input name="material" placeholder="e.g. Vita A2" />
              )}
            </div>

            {/* Shade — always visible so doctor can type it; required when material demands it */}
            <div className="grid gap-2">
              <Label htmlFor="shade">Shade{needsShade ? " *" : ""}</Label>
              <Input
                id="shade"
                name="shade"
                placeholder="e.g. A2, BL2, OM1"
                required={needsShade}
              />
            </div>

            {/* Arch */}
            <div className="grid gap-2">
              <Label htmlFor="arch">Arch</Label>
              <Select id="arch" name="arch" defaultValue="">
                <option value="">— Select arch —</option>
                <option value="upper">Upper</option>
                <option value="lower">Lower</option>
                <option value="both">Both</option>
              </Select>
            </div>
          </div>

          {/* Tooth chart */}
          <div className="space-y-2">
            <Label>Tooth selection (FDI)</Label>
            <ToothChart selected={selectedTeeth} onChange={setSelectedTeeth} />
          </div>
        </CardContent>
      </Card>

      {/* ── Notes ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Colour references, special instructions, photos to follow…"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* ── Submit ───────────────────────────────────────────── */}
      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          After submission you can upload STLs and photos from the case detail page.
        </p>
        <Button type="submit" disabled={isPending || formData.clinics.length === 0}>
          {isPending ? "Submitting…" : "Submit case"}
        </Button>
      </div>
    </form>
  );
}
