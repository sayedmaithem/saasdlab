"use client";

import { useState, useTransition } from "react";
import {
  upsertLabOperationAction,
  deleteLabOperationAction,
} from "@/app/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabOperation } from "@/lib/data/master-data";

export function OperationsManager({
  operations,
  canManage,
}: {
  operations: LabOperation[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertLabOperationAction(formData);
      setMessage(result.message);
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deleteLabOperationAction(id);
      setMessage(result.message);
    });
  }

  const active = operations.filter((o) => o.isActive);
  const inactive = operations.filter((o) => !o.isActive);

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add operation / work type</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="operationId" value="" />
              <div>
                <Label htmlFor="op-name">Name</Label>
                <Input id="op-name" name="name" placeholder="e.g. Full Zirconia Crown" required />
              </div>
              <div>
                <Label htmlFor="op-code">Code (optional)</Label>
                <Input id="op-code" name="code" placeholder="e.g. FZC" />
              </div>
              <div>
                <Label htmlFor="op-category">Category (optional)</Label>
                <Input id="op-category" name="category" placeholder="e.g. Crown, Bridge, Implant" />
              </div>
              <div>
                <Label htmlFor="op-units">Default units</Label>
                <Input
                  id="op-units"
                  name="defaultUnits"
                  type="number"
                  min={1}
                  defaultValue={1}
                />
              </div>
              <div>
                <Label htmlFor="op-sort">Sort order</Label>
                <Input
                  id="op-sort"
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input name="isActive" type="checkbox" id="op-active" defaultChecked />
                <Label htmlFor="op-active">Active</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save operation"}
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
            Active operations{" "}
            <span className="font-normal text-muted-foreground">({active.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No operations configured yet. Add your first work type above.
            </p>
          ) : (
            <div className="divide-y">
              {active.map((op) => (
                <div key={op.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {op.name}
                      {op.code ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {op.code}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {op.category ?? "No category"} · default {op.defaultUnits} unit
                      {op.defaultUnits !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="green">Active</Badge>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => deactivate(op.id)}
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactive.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Inactive{" "}
              <span className="font-normal text-muted-foreground">({inactive.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {inactive.map((op) => (
                <div key={op.id} className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-muted-foreground line-through">{op.name}</p>
                  <Badge tone="neutral">Inactive</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
