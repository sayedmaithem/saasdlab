"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  upsertOperationPriceAction,
  deleteOperationPriceAction,
} from "@/app/actions/master-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { OperationPrice, PriceGroup, LabOperation, LabMaterial } from "@/lib/data/master-data";

export function OperationPricesManager({
  prices,
  priceGroups,
  operations,
  materials,
  selectedGroupId,
  canManage,
}: {
  prices: OperationPrice[];
  priceGroups: PriceGroup[];
  operations: LabOperation[];
  materials: LabMaterial[];
  selectedGroupId: string | null;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0] ?? "";

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertOperationPriceAction(formData);
      setMessage(result.message);
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deleteOperationPriceAction(id);
      setMessage(result.message);
    });
  }

  if (priceGroups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No price groups configured yet.{" "}
        <Link
          href="/command-center/master-data/price-groups"
          className="font-medium text-primary hover:underline"
        >
          Create price groups first →
        </Link>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No operations configured yet.{" "}
        <Link
          href="/command-center/master-data/operations"
          className="font-medium text-primary hover:underline"
        >
          Configure operations first →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/command-center/master-data/prices"
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            !selectedGroupId
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All groups
        </Link>
        {priceGroups.map((g) => (
          <Link
            key={g.id}
            href={`/command-center/master-data/prices?group=${g.id}`}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedGroupId === g.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add price</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="priceId" value="" />
              <div>
                <Label htmlFor="pr-group">Price group</Label>
                <Select
                  id="pr-group"
                  name="priceGroupId"
                  defaultValue={selectedGroupId ?? ""}
                  required
                >
                  <option value="" disabled>
                    Select group
                  </option>
                  {priceGroups.filter((g) => g.isActive).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pr-op">Operation</Label>
                <Select id="pr-op" name="operationId" defaultValue="" required>
                  <option value="" disabled>
                    Select operation
                  </option>
                  {operations.filter((o) => o.isActive).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pr-mat">Material (optional)</Label>
                <Select id="pr-mat" name="materialId" defaultValue="">
                  <option value="">Any material</option>
                  {materials.filter((m) => m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pr-price">Unit price</Label>
                <Input
                  id="pr-price"
                  name="unitPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={0}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pr-currency">Currency</Label>
                <Input id="pr-currency" name="currency" defaultValue="IQD" maxLength={10} />
              </div>
              <div>
                <Label htmlFor="pr-date">Effective from</Label>
                <Input
                  id="pr-date"
                  name="effectiveFrom"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input name="isActive" type="checkbox" id="pr-active" defaultChecked />
                <Label htmlFor="pr-active">Active</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save price"}
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
            Prices{" "}
            <span className="font-normal text-muted-foreground">({prices.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prices configured{selectedGroupId ? " for this group" : ""}. Use the form above
              to add unit prices per operation.
            </p>
          ) : (
            <div className="divide-y">
              {prices.map((price) => (
                <div key={price.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {price.operationName ?? "Unknown operation"}
                      {price.materialName ? (
                        <span className="ml-1 font-normal text-muted-foreground">
                          / {price.materialName}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {price.priceGroupName ?? "No group"} · from {price.effectiveFrom}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-semibold">
                      {price.unitPrice.toLocaleString()} {price.currency}
                    </p>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => deactivate(price.id)}
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : null}
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
