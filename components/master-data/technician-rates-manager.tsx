"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { upsertTechnicianRateAction } from "@/app/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TechnicianRate, LabOperation, LabMaterial } from "@/lib/data/master-data";

type TechnicianOption = { id: string; name: string };

const RATE_TYPE_LABELS: Record<string, string> = {
  per_unit: "Per unit",
  fixed: "Fixed",
  hourly: "Hourly",
};

export function TechnicianRatesManager({
  rates,
  technicians,
  operations,
  materials,
  selectedTechId,
  canManage,
}: {
  rates: TechnicianRate[];
  technicians: TechnicianOption[];
  operations: LabOperation[];
  materials: LabMaterial[];
  selectedTechId: string | null;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertTechnicianRateAction(formData);
      setMessage(result.message);
    });
  }

  if (technicians.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No active technicians configured yet.{" "}
        <Link href="/technicians/new" className="font-medium text-primary hover:underline">
          Add your first technician →
        </Link>{" "}
        then return here to set their operation rates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/command-center/master-data/technician-rates"
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            !selectedTechId
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All technicians
        </Link>
        {technicians.map((t) => (
          <Link
            key={t.id}
            href={`/command-center/master-data/technician-rates?technician=${t.id}`}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedTechId === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add rate</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="rateId" value="" />
              <div>
                <Label htmlFor="rt-tech">Technician</Label>
                <Select
                  id="rt-tech"
                  name="technicianId"
                  defaultValue={selectedTechId ?? ""}
                  required
                >
                  <option value="" disabled>
                    Select technician
                  </option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="rt-type">Rate type</Label>
                <Select id="rt-type" name="rateType" defaultValue="per_unit">
                  <option value="per_unit">Per unit</option>
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="rt-op">Operation (optional)</Label>
                <Select id="rt-op" name="operationId" defaultValue="">
                  <option value="">Any operation</option>
                  {operations.filter((o) => o.isActive).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="rt-mat">Material (optional)</Label>
                <Select id="rt-mat" name="materialId" defaultValue="">
                  <option value="">Any material</option>
                  {materials.filter((m) => m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="rt-amount">Rate amount</Label>
                <Input
                  id="rt-amount"
                  name="rateAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={0}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rt-currency">Currency</Label>
                <Input id="rt-currency" name="currency" defaultValue="IQD" maxLength={10} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input name="isActive" type="checkbox" id="rt-active" defaultChecked />
                <Label htmlFor="rt-active">Active</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save rate"}
                </Button>
              </div>
            </form>
            {message ? (
              <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            Rates{" "}
            <span className="font-normal text-muted-foreground">({rates.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rates configured{selectedTechId ? " for this technician" : ""}. Rates are used
              for internal cost and margin tracking.
            </p>
          ) : (
            <div className="divide-y">
              {rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {rate.technicianName ?? "Unknown technician"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rate.operationName ?? "Any operation"}
                      {rate.materialName ? ` / ${rate.materialName}` : ""} ·{" "}
                      {RATE_TYPE_LABELS[rate.rateType] ?? rate.rateType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold">
                      {rate.rateAmount.toLocaleString()} {rate.currency}
                    </p>
                    <Badge tone="neutral">{RATE_TYPE_LABELS[rate.rateType]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
