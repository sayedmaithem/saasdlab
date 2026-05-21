"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { upsertPriceGroupAction } from "@/app/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PriceGroup } from "@/lib/data/master-data";

export function PriceGroupsManager({
  priceGroups,
  canManage,
}: {
  priceGroups: PriceGroup[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertPriceGroupAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Create price group</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="priceGroupId" value="" />
              <div>
                <Label htmlFor="pg-name">Name</Label>
                <Input
                  id="pg-name"
                  name="name"
                  placeholder="e.g. Standard, VIP, Wholesale"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pg-desc">Description (optional)</Label>
                <Input
                  id="pg-desc"
                  name="description"
                  placeholder="Brief description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input name="isDefault" type="checkbox" id="pg-default" />
                <Label htmlFor="pg-default">Default group</Label>
              </div>
              <div className="flex items-center gap-2">
                <input name="isActive" type="checkbox" id="pg-active" defaultChecked />
                <Label htmlFor="pg-active">Active</Label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save price group"}
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
            Price groups{" "}
            <span className="font-normal text-muted-foreground">({priceGroups.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priceGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No price groups yet. Create your first group above, then set prices for each
              operation.
            </p>
          ) : (
            <div className="divide-y">
              {priceGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold">{group.name}</p>
                    {group.description ? (
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {group.isDefault ? <Badge tone="blue">Default</Badge> : null}
                    <Badge tone={group.isActive ? "green" : "neutral"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Link
                      href={`/command-center/master-data/prices?group=${group.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View prices →
                    </Link>
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
