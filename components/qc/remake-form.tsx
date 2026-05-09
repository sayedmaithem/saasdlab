"use client";

import { useState, useTransition } from "react";
import { createRemakeAction } from "@/app/actions/quality";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { remakeResponsibilities } from "@/lib/quality/qc-rules";
import type { CaseFileItem } from "@/lib/data/cases";

export function RemakeForm({
  caseId,
  files,
  canManage,
}: {
  caseId: string;
  files: CaseFileItem[];
  canManage: boolean;
}) {
  const photoFiles = files.filter((file) =>
    ["image", "photo"].some((kind) => file.fileType.toLowerCase().includes(kind)) ||
    file.category === "qc_photos" ||
    file.mimeType?.startsWith("image/"),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createRemakeAction(formData);
      setMessage(result.message);
    });
  }

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        Remake tracking is internal to lab staff.
      </p>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="caseId" value={caseId} />

      <div className="grid gap-2">
        <Label htmlFor="originalCaseId">Original case ID</Label>
        <Input
          id="originalCaseId"
          name="originalCaseId"
          placeholder="Optional UUID when this is linked to another case"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="remakeReason">Reason</Label>
        <Input id="remakeReason" name="reason" required placeholder="Shade issue, fracture, margin issue..." />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="responsibility">Responsibility</Label>
        <Select id="responsibility" name="responsibility" defaultValue="unknown" required>
          {remakeResponsibilities.map((responsibility) => (
            <option key={responsibility} value={responsibility}>
              {responsibility.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="costImpact">Cost impact</Label>
        <Input id="costImpact" name="costImpact" type="number" min="0" step="0.01" defaultValue="0" />
      </div>

      {photoFiles.length > 0 ? (
        <div className="grid gap-2">
          <Label htmlFor="photoFileIds">Photos</Label>
          <select
            id="photoFileIds"
            name="photoFileIds"
            multiple
            className="min-h-28 rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {photoFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.fileName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="remakeNotes">Notes</Label>
        <Textarea id="remakeNotes" name="notes" rows={4} />
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" variant="secondary" disabled={isPending}>
        Create remake record
      </Button>
    </form>
  );
}
