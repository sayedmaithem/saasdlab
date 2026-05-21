"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { UserCheck, UserX, Wrench } from "lucide-react";
import { deactivateTechnicianAction } from "@/app/actions/technicians";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Technician } from "@/lib/data/technicians";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  contractor: "Contractor",
};

function statusTone(status: string) {
  if (status === "active") return "green" as const;
  if (status === "contractor") return "blue" as const;
  return "neutral" as const;
}

function TechnicianCard({
  technician,
  canManage,
  onMessage,
}: {
  technician: Technician;
  canManage: boolean;
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function deactivate() {
    startTransition(async () => {
      const result = await deactivateTechnicianAction(technician.id);
      onMessage(result.message);
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{technician.displayName}</p>
          <Badge tone={statusTone(technician.employmentStatus)}>
            {STATUS_LABELS[technician.employmentStatus] ?? technician.employmentStatus}
          </Badge>
          {technician.hasPortalAccount ? (
            <Badge tone="green">
              <UserCheck className="mr-1 size-3" />
              Portal active
            </Badge>
          ) : (
            <Badge tone="neutral">
              <UserX className="mr-1 size-3" />
              No portal account
            </Badge>
          )}
        </div>
        {technician.phone ? (
          <p className="mt-1 text-sm text-muted-foreground">{technician.phone}</p>
        ) : null}
        {technician.skills.length > 0 ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Wrench className="size-3" />
            {technician.skills.map((s) => s.skill).join(", ")}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No skills registered</p>
        )}
      </div>
      {canManage ? (
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/technicians/${technician.id}/edit`}>Edit</Link>
          </Button>
          {technician.employmentStatus === "active" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={deactivate}
              className="text-muted-foreground hover:text-destructive"
            >
              Deactivate
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TechnicianList({
  technicians,
  canManage,
}: {
  technicians: Technician[];
  canManage: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const active = technicians.filter((t) => t.employmentStatus !== "inactive");
  const inactive = technicians.filter((t) => t.employmentStatus === "inactive");

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg border bg-background p-3 text-sm">{message}</p>
      ) : null}

      {canManage ? (
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/technicians/new">Add technician</Link>
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            Active technicians{" "}
            <span className="font-normal text-muted-foreground">({active.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No active technicians yet.{" "}
              {canManage ? (
                <Link href="/technicians/new" className="font-medium text-primary hover:underline">
                  Add your first technician →
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((t) => (
                <TechnicianCard
                  key={t.id}
                  technician={t}
                  canManage={canManage}
                  onMessage={setMessage}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactive.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Inactive ({inactive.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactive.map((t) => (
                <TechnicianCard
                  key={t.id}
                  technician={t}
                  canManage={canManage}
                  onMessage={setMessage}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
