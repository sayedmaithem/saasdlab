"use client";

import { useState, useTransition } from "react";
import {
  upsertLabMaterialAction,
  deleteLabMaterialAction,
} from "@/app/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabMaterial } from "@/lib/data/master-data";

export function MaterialsManager({
  materials,
  canManage,
}: {
  materials: LabMaterial[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertLabMaterialAction(formData);
      setMessage(result.message);
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deleteLabMaterialAction(id);
      setMessage(result.message);
    });
  }

  const active = materials.filter((m) => m.isActive);
  const inactive = materials.filter((m) => !m.isActive);

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add material</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="materialId" value="" />
              <div>
                <Label htmlFor="mat-name">Name</Label>
                <Input id="mat-name" name="name" placeholder="e.g. Zirconia" required />
              </div>
              <div>
                <Label htmlFor="mat-code">Code (optional)</Label>
                <Input id="mat-code" name="code" placeholder="e.g. ZR" />
              </div>
              <div>
                <Label htmlFor="mat-category">Category (optional)</Label>
                <Input
                  id="mat-category"
                  name="category"
                  placeholder="e.g. Ceramic, Metal, Resin"
                />
              </div>
              <div>
                <Label htmlFor="mat-sort">Sort order</Label>
                <Input id="mat-sort" name="sortOrder" type="number" min={0} defaultValue={0} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input name="shadeRequired" type="checkbox" id="mat-shade" />
                <Label htmlFor="mat-shade">Shade required</Label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input name="isActive" type="checkbox" id="mat-active" defaultChecked />
                <Label htmlFor="mat-active">Active</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save material"}
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
            Active materials{" "}
            <span className="font-normal text-muted-foreground">({active.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No materials configured yet. Add your first material above.
            </p>
          ) : (
            <div className="divide-y">
              {active.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {mat.name}
                      {mat.code ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {mat.code}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mat.category ?? "No category"}
                      {mat.shadeRequired ? " · shade required" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="green">Active</Badge>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => deactivate(mat.id)}
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
              {inactive.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-muted-foreground line-through">{mat.name}</p>
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
