"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileArchive,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  createDesignVersionAction,
  decideDesignVersionAction,
  setDesignPreviewAction,
} from "@/app/actions/designs";
import {
  createCaseFileDownloadUrlAction,
  registerCaseFileAction,
} from "@/app/actions/case-files";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CaseFileItem, DesignVersionItem } from "@/lib/data/cases";
import {
  CASE_FILES_BUCKET,
  buildCaseStoragePath,
  getCaseFileKind,
  isImageCaseFile,
  validateCaseFileInput,
} from "@/lib/files/case-file-rules";
import {
  designStatusLabels,
  type DesignStatus,
} from "@/lib/design/design-workflow";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not decided";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: DesignStatus) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "needs_changes") return "amber";
  if (status === "pending_review") return "blue";
  return "neutral";
}

function SignedPreviewImage({ fileId }: { fileId: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUrl() {
      if (!fileId) return;
      const result = await createCaseFileDownloadUrlAction(fileId);
      if (active && result.ok && result.url) {
        setUrl(result.url);
      }
    }

    void loadUrl();

    return () => {
      active = false;
    };
  }, [fileId]);

  if (!fileId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border bg-muted/30 text-xs text-muted-foreground">
        No preview
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border bg-muted/30">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Design preview"
      className="aspect-video w-full rounded-md border object-cover"
    />
  );
}

function DesignFileList({ files }: { files: CaseFileItem[] }) {
  const [message, setMessage] = useState<string | null>(null);

  async function openFile(file: CaseFileItem, preview: boolean) {
    const result = await createCaseFileDownloadUrlAction(file.id);

    if (!result.ok || !result.url) {
      setMessage(result.message);
      return;
    }

    window.open(result.url, preview ? "_blank" : "_self", "noopener,noreferrer");
  }

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">No design files attached.</p>;
  }

  return (
    <div className="space-y-2">
      {message ? <p className="text-xs text-red-700">{message}</p> : null}
      {files.map((file) => {
        const kind = getCaseFileKind(file.fileName);
        const canPreview = kind ? isImageCaseFile(kind) : false;

        return (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              {canPreview ? (
                <ImageIcon className="size-4 text-muted-foreground" />
              ) : (
                <FileArchive className="size-4 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {file.fileType.toUpperCase()} - {formatBytes(file.fileSize)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {canPreview ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void openFile(file, true)}
                >
                  <Eye />
                  Preview
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void openFile(file, false)}
              >
                <Download />
                Download
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DesignWorkflow({
  labId,
  caseId,
  versions,
  canUpload,
  canDecide,
  canComment,
}: {
  labId: string;
  caseId: string;
  versions: DesignVersionItem[];
  canUpload: boolean;
  canDecide: boolean;
  canComment: boolean;
}) {
  const previewInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const latestApproved = useMemo(
    () => versions.find((version) => version.status === "approved"),
    [versions],
  );

  async function uploadDesignFile(params: {
    file: File;
    designVersionId: string;
    visibility: "internal" | "doctor_visible";
  }) {
    const validation = validateCaseFileInput(params.file);

    if (!validation.ok) {
      return { ok: false, message: validation.message };
    }

    const storagePath = buildCaseStoragePath({
      labId,
      caseId,
      category: "design_versions",
      fileName: params.file.name,
    });
    const supabase = createSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage
      .from(CASE_FILES_BUCKET)
      .upload(storagePath, params.file, {
        cacheControl: "3600",
        contentType: params.file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, message: uploadError.message };
    }

    const result = await registerCaseFileAction({
      caseId,
      storagePath,
      category: "design_versions",
      visibility: params.visibility,
      fileName: params.file.name,
      fileSize: params.file.size,
      mimeType: params.file.type || null,
      designVersionId: params.designVersionId,
    });

    if (!result.ok || !result.fileId) {
      await supabase.storage.from(CASE_FILES_BUCKET).remove([storagePath]);
      return { ok: false, message: result.message };
    }

    return { ok: true, message: result.message, fileId: result.fileId };
  }

  function submitDesignVersion() {
    startTransition(async () => {
      setMessage("Creating design version...");
      const created = await createDesignVersionAction({ caseId, notes });

      if (!created.ok || !created.designVersionId) {
        setMessage(created.message);
        return;
      }

      if (previewFile) {
        setMessage("Uploading preview screenshot...");
        const previewResult = await uploadDesignFile({
          file: previewFile,
          designVersionId: created.designVersionId,
          visibility: "doctor_visible",
        });

        if (!previewResult.ok || !previewResult.fileId) {
          setMessage(previewResult.message);
          return;
        }

        const linked = await setDesignPreviewAction({
          designVersionId: created.designVersionId,
          fileId: previewResult.fileId,
        });

        if (!linked.ok) {
          setMessage(linked.message);
          return;
        }
      }

      for (const file of designFiles) {
        setMessage(`Uploading ${file.name}...`);
        const result = await uploadDesignFile({
          file,
          designVersionId: created.designVersionId,
          visibility: "doctor_visible",
        });

        if (!result.ok) {
          setMessage(result.message);
          return;
        }
      }

      setNotes("");
      setPreviewFile(null);
      setDesignFiles([]);
      if (previewInputRef.current) previewInputRef.current.value = "";
      if (designInputRef.current) designInputRef.current.value = "";
      setMessage(`Design V${created.versionNumber} submitted for review.`);
    });
  }

  function runDecision(formData: FormData) {
    startTransition(async () => {
      const result = await decideDesignVersionAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          {message}
        </div>
      ) : null}

      {canUpload ? (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <Label htmlFor="design-notes">New design version notes</Label>
            <Textarea
              id="design-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What changed in this exocad design?"
              className="mt-2 min-h-24"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => previewInputRef.current?.click()}
              className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed bg-background px-4 py-5 text-center"
            >
              <UploadCloud className="mb-2 size-6 text-muted-foreground" />
              <span className="text-sm font-semibold">Preview screenshot</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {previewFile?.name ?? "JPG, PNG, WEBP"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => designInputRef.current?.click()}
              className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed bg-background px-4 py-5 text-center"
            >
              <UploadCloud className="mb-2 size-6 text-muted-foreground" />
              <span className="text-sm font-semibold">Design files</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {designFiles.length
                  ? `${designFiles.length} files selected`
                  : "STL, OBJ, PLY, ZIP, EXOCAD, PDF"}
              </span>
            </button>
          </div>
          <input
            ref={previewInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => setPreviewFile(event.target.files?.[0] ?? null)}
          />
          <input
            ref={designInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.stl,.obj,.ply,.zip,.exocad,.pdf"
            className="hidden"
            onChange={(event) =>
              setDesignFiles(Array.from(event.target.files ?? []))
            }
          />
          <Button
            type="button"
            onClick={submitDesignVersion}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            Submit Design Version
          </Button>
        </div>
      ) : null}

      {latestApproved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          Approved design: V{latestApproved.versionNumber} on{" "}
          {formatDate(latestApproved.approvalDecidedAt)}.
        </div>
      ) : null}

      <div className="space-y-4">
        {versions.length ? (
          versions.map((version) => (
            <article key={version.id} className="rounded-lg border bg-card p-4">
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <SignedPreviewImage fileId={version.previewFileId} />
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">
                          V{version.versionNumber}
                        </h3>
                        <Badge tone={statusTone(version.status)}>
                          {designStatusLabels[version.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Uploaded by {version.uploadedByName} on{" "}
                        {formatDate(version.uploadedAt)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Decision: {formatDate(version.approvalDecidedAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Notes</p>
                      <p className="mt-1 text-muted-foreground">
                        {version.notes ?? "No notes."}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Doctor response</p>
                      <p className="mt-1 text-muted-foreground">
                        {version.doctorResponse ??
                          version.approvalComment ??
                          "No response yet."}
                      </p>
                    </div>
                  </div>

                  <DesignFileList files={version.files} />

                  {(canDecide || canComment) &&
                  version.status !== "approved" ? (
                    <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                      <form action={runDecision} className="space-y-2">
                        <input
                          type="hidden"
                          name="designVersionId"
                          value={version.id}
                        />
                        <input type="hidden" name="decision" value="comment" />
                        <Textarea
                          name="comment"
                          placeholder="Add doctor/lab comment"
                          className="min-h-20"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={isPending || !canComment}
                        >
                          <MessageSquare />
                          Add comment
                        </Button>
                      </form>

                      {canDecide ? (
                        <div className="space-y-2">
                          <form action={runDecision}>
                            <input
                              type="hidden"
                              name="designVersionId"
                              value={version.id}
                            />
                            <input type="hidden" name="decision" value="approved" />
                            <Button type="submit" size="sm" disabled={isPending}>
                              <CheckCircle2 />
                              Approve
                            </Button>
                          </form>
                          <form action={runDecision} className="space-y-2">
                            <input
                              type="hidden"
                              name="designVersionId"
                              value={version.id}
                            />
                            <input
                              type="hidden"
                              name="decision"
                              value="needs_changes"
                            />
                            <Textarea
                              name="comment"
                              placeholder="Requested changes"
                              className="min-h-20"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                            >
                              <RotateCcw />
                              Request changes
                            </Button>
                          </form>
                          <form action={runDecision} className="space-y-2">
                            <input
                              type="hidden"
                              name="designVersionId"
                              value={version.id}
                            />
                            <input type="hidden" name="decision" value="rejected" />
                            <Textarea
                              name="comment"
                              placeholder="Rejection reason"
                              className="min-h-20"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="destructive"
                              disabled={isPending}
                            >
                              <XCircle />
                              Reject
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            No design versions have been uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
