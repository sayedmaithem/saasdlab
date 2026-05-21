"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import {
  createCaseFileDownloadUrlAction,
  registerCaseFileAction,
} from "@/app/actions/case-files";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CaseFileItem } from "@/lib/data/cases";
import {
  CASE_FILES_BUCKET,
  buildCaseStoragePath,
  caseFileCategories,
  caseFileCategoryConfig,
  caseFileVisibilityLabels,
  getCaseFileKind,
  isImageCaseFile,
  validateCaseFileInput,
  type CaseFileCategory,
  type CaseFileVisibility,
} from "@/lib/files/case-file-rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "saved" | "error";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  message: string;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDefaultVisibility(
  visibilities: CaseFileVisibility[],
  category: CaseFileCategory,
) {
  if (category === "invoices" && visibilities.includes("private_finance")) {
    return "private_finance";
  }

  return visibilities[0] ?? "internal";
}

export function CaseFileManager({
  labId,
  caseId,
  files,
  allowedUploadCategories,
  allowedUploadVisibilities,
}: {
  labId: string;
  caseId: string;
  files: CaseFileItem[];
  allowedUploadCategories: CaseFileCategory[];
  allowedUploadVisibilities: CaseFileVisibility[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<CaseFileCategory>(
    allowedUploadCategories[0] ?? "doctor_uploads",
  );
  const [visibility, setVisibility] = useState<CaseFileVisibility>(
    getDefaultVisibility(allowedUploadVisibilities, category),
  );
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const canUpload =
    allowedUploadCategories.length > 0 && allowedUploadVisibilities.length > 0;
  const groupedFiles = useMemo(
    () =>
      caseFileCategories
        .map((fileCategory) => ({
          category: fileCategory,
          files: files.filter((file) => file.category === fileCategory),
        }))
        .filter((group) => group.files.length > 0),
    [files],
  );

  function setUploadStatus(id: string, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const selectedFiles = Array.from(fileList);

    if (!selectedFiles.length || !canUpload) return;

    const supabase = createSupabaseBrowserClient();
    setMessage(null);

    for (const file of selectedFiles) {
      const validation = validateCaseFileInput(file);
      const uploadId = crypto.randomUUID();

      setUploads((current) => [
        {
          id: uploadId,
          name: file.name,
          size: file.size,
          status: validation.ok ? "queued" : "error",
          message: validation.ok ? "Queued" : validation.message,
        },
        ...current,
      ]);

      if (!validation.ok) continue;

      const storagePath = buildCaseStoragePath({
        labId,
        caseId,
        category,
        fileName: file.name,
      });

      setUploadStatus(uploadId, {
        status: "uploading",
        message: "Uploading to secure storage",
      });

      const { error: uploadError } = await supabase.storage
        .from(CASE_FILES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        setUploadStatus(uploadId, {
          status: "error",
          message: uploadError.message,
        });
        continue;
      }

      const result = await registerCaseFileAction({
        caseId,
        storagePath,
        category,
        visibility,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
      });

      if (!result.ok) {
        await supabase.storage.from(CASE_FILES_BUCKET).remove([storagePath]);
        setUploadStatus(uploadId, {
          status: "error",
          message: result.message,
        });
        continue;
      }

      setUploadStatus(uploadId, {
        status: "saved",
        message: "Saved",
      });
      setMessage(result.message);
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    startTransition(() => {
      void uploadFiles(fileList);
    });
  }

  async function openSignedUrl(file: CaseFileItem, preview: boolean) {
    setMessage(null);
    const result = await createCaseFileDownloadUrlAction(file.id);

    if (!result.ok || !result.url) {
      setMessage(result.message);
      return;
    }

    window.open(result.url, preview ? "_blank" : "_self", "noopener,noreferrer");
  }

  return (
    <div className="space-y-5">
      {canUpload ? (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="case-file-category">Category</Label>
              <Select
                id="case-file-category"
                value={category}
                onChange={(event) => {
                  const nextCategory = event.target.value as CaseFileCategory;
                  setCategory(nextCategory);
                  setVisibility(
                    getDefaultVisibility(
                      allowedUploadVisibilities,
                      nextCategory,
                    ),
                  );
                }}
              >
                {allowedUploadCategories.map((item) => (
                  <option key={item} value={item}>
                    {caseFileCategoryConfig[item].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-file-visibility">Visibility</Label>
              <Select
                id="case-file-visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as CaseFileVisibility)
                }
              >
                {allowedUploadVisibilities.map((item) => (
                  <option key={item} value={item}>
                    {caseFileVisibilityLabels[item]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
            className={cn(
              "flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-background px-4 py-6 text-center transition-colors",
              isDragging && "border-primary bg-primary/5",
            )}
          >
            <UploadCloud className="mb-3 size-8 text-muted-foreground" />
            <span className="text-sm font-semibold">
              Drop files here or choose files
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WEBP, STL, OBJ, PLY, DICOM, PDF, ZIP, EXOCAD
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
            accept=".jpg,.jpeg,.png,.webp,.stl,.obj,.ply,.dcm,.dicom,.pdf,.zip,.exocad"
          />

          {uploads.length > 0 ? (
            <div className="space-y-2">
              {uploads.slice(0, 5).map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{upload.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(upload.size)} - {upload.message}
                    </p>
                  </div>
                  {upload.status === "uploading" ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Badge
                      tone={
                        upload.status === "saved"
                          ? "green"
                          : upload.status === "error"
                            ? "red"
                            : "neutral"
                      }
                    >
                      {upload.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          You can view permitted files for this case.
        </div>
      )}

      {message ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        {groupedFiles.length > 0 ? (
          groupedFiles.map((group) => (
            <section key={group.category} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {caseFileCategoryConfig[group.category].label}
                </h3>
                <Badge tone="neutral">{group.files.length}</Badge>
              </div>
              <div className="space-y-2">
                {group.files.map((file) => {
                  const fileKind = getCaseFileKind(file.fileName);
                  const canPreview = fileKind ? isImageCaseFile(fileKind) : false;

                  return (
                    <div
                      key={file.id}
                      className="grid gap-3 rounded-lg border bg-card p-3 text-sm lg:grid-cols-[1fr_auto]"
                    >
                      <div className="flex min-w-0 gap-3">
                        {canPreview ? (
                          <ImageIcon className="mt-0.5 size-5 text-muted-foreground" />
                        ) : (
                          <FileText className="mt-0.5 size-5 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {file.fileName}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{file.fileType.toUpperCase()}</span>
                            <span>{formatBytes(file.fileSize)}</span>
                            <span>{file.uploadedByName}</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="neutral">
                              {caseFileVisibilityLabels[file.visibility]}
                            </Badge>
                            {file.designVersionId ? (
                              <a
                                href={`/cases/${file.caseId}#design-versions`}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Design version
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPreview ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void openSignedUrl(file, true)}
                            disabled={isPending}
                          >
                            <Eye />
                            Preview
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void openSignedUrl(file, false)}
                          disabled={isPending}
                        >
                          <Download />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            No files uploaded yet. Upload scans, photos, and case documents to get started.
          </div>
        )}
      </div>
    </div>
  );
}
