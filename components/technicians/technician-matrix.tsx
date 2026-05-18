"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { productionStages, stageLabels } from "@/lib/constants/workflow";

// ── Types (inline — no DB layer dependency in client component) ───────────────

export interface TechnicianStagePermission {
  id: string;
  stage_id: string;
  stage_key: string;
  stage_name: string;
  can_work: boolean;
  can_move_from: boolean;
  can_move_to: boolean;
}

// ── Server actions (passed as props to keep client bundle clean) ───────────────

export interface TechnicianMatrixProps {
  technicianId: string;
  permissions: TechnicianStagePermission[];
  canManage: boolean;
  // Server action signatures — invoked via useTransition
  onGrant: (technicianId: string, stageKey: string) => Promise<{ ok: boolean; message: string }>;
  onRevoke: (permissionId: string) => Promise<{ ok: boolean; message: string }>;
}

// ── Grant form ────────────────────────────────────────────────────────────────

function GrantStageForm({
  technicianId,
  existingKeys,
  onGrant,
  onDone,
}: {
  technicianId: string;
  existingKeys: Set<string>;
  onGrant: TechnicianMatrixProps["onGrant"];
  onDone: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedKey, setSelectedKey] = useState("");

  const available = productionStages.filter((key) => !existingKeys.has(key));

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        All stages have been granted to this technician.
      </p>
    );
  }

  function submit() {
    if (!selectedKey) return;
    startTransition(async () => {
      const result = await onGrant(technicianId, selectedKey);
      onDone(result.message);
      setSelectedKey("");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="stage-grant">Add stage permission</Label>
        <Select
          id="stage-grant"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">— Select stage —</option>
          {available.map((key) => (
            <option key={key} value={key}>
              {stageLabels[key]}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={submit}
        disabled={isPending || !selectedKey}
      >
        <Plus className="size-4" />
        {isPending ? "Granting…" : "Grant access"}
      </Button>
    </div>
  );
}

// ── Permission row ────────────────────────────────────────────────────────────

function PermissionRow({
  perm,
  canManage,
  onRevoke,
  onMessage,
}: {
  perm: TechnicianStagePermission;
  canManage: boolean;
  onRevoke: TechnicianMatrixProps["onRevoke"];
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function revoke() {
    if (!confirm(`Remove "${perm.stage_name}" permission from this technician?`)) return;
    startTransition(async () => {
      const result = await onRevoke(perm.id);
      onMessage(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{perm.stage_name}</p>
        <code className="text-xs text-muted-foreground">{perm.stage_key}</code>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {perm.can_work && <Badge tone="green">Can work</Badge>}
        {perm.can_move_from && <Badge tone="neutral">Move from</Badge>}
        {perm.can_move_to && <Badge tone="neutral">Move to</Badge>}
      </div>
      {canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={revoke}
          disabled={isPending}
          className="text-destructive hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="size-4" />
          {isPending ? "Revoking…" : "Revoke"}
        </Button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TechnicianMatrix({
  technicianId,
  permissions,
  canManage,
  onGrant,
  onRevoke,
}: TechnicianMatrixProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [localPerms, setLocalPerms] = useState(permissions);

  const existingKeys = new Set(localPerms.map((p) => p.stage_key));

  function handleDone(msg: string) {
    setMessage(msg);
    // After grant/revoke the parent page re-fetches via server revalidation,
    // but we also update local state optimistically to give instant feedback.
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Control which production stages this technician is permitted to work. Permissions
          are additive — granting a stage allows the technician to accept cases at that stage.
        </p>

        {message && (
          <div className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm">
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
            {message}
          </div>
        )}

        {localPerms.length > 0 ? (
          <div className="space-y-2">
            {localPerms.map((perm) => (
              <PermissionRow
                key={perm.id}
                perm={perm}
                canManage={canManage}
                onRevoke={async (id) => {
                  const result = await onRevoke(id);
                  if (result.ok) {
                    setLocalPerms((prev) => prev.filter((p) => p.id !== id));
                  }
                  return result;
                }}
                onMessage={setMessage}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No stage permissions set</p>
            <p className="text-xs text-muted-foreground">
              This technician can be assigned cases but has no explicit stage restrictions.
              Grant specific stage access to limit their production scope.
            </p>
          </div>
        )}

        {canManage && (
          <GrantStageForm
            technicianId={technicianId}
            existingKeys={existingKeys}
            onGrant={async (tId, stageKey) => {
              const result = await onGrant(tId, stageKey);
              if (result.ok) {
                // Add optimistic row with placeholder id
                setLocalPerms((prev) => [
                  ...prev,
                  {
                    id: `opt-${stageKey}`,
                    stage_id: stageKey,
                    stage_key: stageKey,
                    stage_name: stageLabels[stageKey as keyof typeof stageLabels] ?? stageKey,
                    can_work: true,
                    can_move_from: false,
                    can_move_to: false,
                  },
                ]);
              }
              return result;
            }}
            onDone={handleDone}
          />
        )}

        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <p className="text-xs font-semibold">How permissions work</p>
          <p className="text-xs text-muted-foreground">
            <strong>Can work</strong> — technician may accept and complete work at this stage.{" "}
            <strong>Move from</strong> — may manually pull a case out of this stage.{" "}
            <strong>Move to</strong> — may push a case into this stage.{" "}
            Absence of all three means the stage is not part of this technician&apos;s scope.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
