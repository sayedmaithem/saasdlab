"use client";

import { useState, useTransition } from "react";
import { submitQualityCheckAction } from "@/app/actions/quality";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getQcChecklistForWorkType, type QcResult } from "@/lib/quality/qc-rules";

export type LatestQualityCheck = {
  result: QcResult;
  notes: string | null;
  checkedByName: string;
  createdAt: string;
} | null;

const resultTone: Record<QcResult, "green" | "amber" | "red"> = {
  passed: "green",
  needs_adjustment: "amber",
  failed: "red",
};

export function QualityControlForm({
  caseId,
  workType,
  latestCheck,
  canManage,
}: {
  caseId: string;
  workType: string;
  latestCheck: LatestQualityCheck;
  canManage: boolean;
}) {
  const checklist = getQcChecklistForWorkType(workType);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await submitQualityCheckAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-4">
      {latestCheck ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Latest QC</p>
            <Badge tone={resultTone[latestCheck.result]}>
              {latestCheck.result.replaceAll("_", " ")}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {latestCheck.checkedByName} / {latestCheck.createdAt}
          </p>
          {latestCheck.notes ? <p className="mt-2">{latestCheck.notes}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No QC record yet.</p>
      )}

      {canManage ? (
        <form action={submit} className="space-y-4">
          <input type="hidden" name="caseId" value={caseId} />
          <div className="grid gap-3">
            {checklist.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <input
                  name={item.key}
                  type="checkbox"
                  className="size-4 rounded border-border"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qc-result">QC result</Label>
            <Select id="qc-result" name="result" defaultValue="passed" required>
              <option value="passed">Passed</option>
              <option value="needs_adjustment">Needs adjustment</option>
              <option value="failed">Failed</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qc-notes">Reason / notes</Label>
            <Textarea
              id="qc-notes"
              name="notes"
              placeholder="Required for failed or needs adjustment."
              rows={4}
            />
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={isPending}>Save QC result</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          QC actions are available to lab managers and assigned technicians.
        </p>
      )}
    </div>
  );
}
