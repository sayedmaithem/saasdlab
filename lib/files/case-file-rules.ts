import type { IntakeFileType } from "@/lib/constants/workflow";

export const CASE_FILES_BUCKET = "case-files";
export const MAX_CASE_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export const caseFileCategories = [
  "doctor_uploads",
  "scan_files",
  "photos",
  "exocad_design",
  "design_versions",
  "cam_milling",
  "qc_photos",
  "delivery",
  "invoices",
] as const;

export type CaseFileCategory = (typeof caseFileCategories)[number];

export const caseFileVisibilities = [
  "internal",
  "doctor_visible",
  "private_finance",
] as const;

export type CaseFileVisibility = (typeof caseFileVisibilities)[number];

export const caseFileCategoryConfig: Record<
  CaseFileCategory,
  { label: string; folder: string }
> = {
  doctor_uploads: { label: "Doctor uploads", folder: "doctor-uploads" },
  scan_files: { label: "Scan files", folder: "scan-files" },
  photos: { label: "Photos", folder: "photos" },
  exocad_design: { label: "exocad design", folder: "exocad-design" },
  design_versions: { label: "Design versions", folder: "design-versions" },
  cam_milling: { label: "CAM / milling", folder: "cam-milling" },
  qc_photos: { label: "QC photos", folder: "qc-photos" },
  delivery: { label: "Delivery", folder: "delivery" },
  invoices: { label: "Invoices", folder: "invoices" },
};

export const caseFileVisibilityLabels: Record<CaseFileVisibility, string> = {
  internal: "Internal",
  doctor_visible: "Doctor visible",
  private_finance: "Private finance",
};

const extensionToKind: Record<string, IntakeFileType> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  stl: "stl",
  obj: "obj",
  ply: "ply",
  dcm: "dicom",
  dicom: "dicom",
  pdf: "pdf",
  zip: "zip",
  exocad: "exocad",
};

export const allowedCaseFileExtensions = Object.keys(extensionToKind);

export function getCaseFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  return extension ?? "";
}

export function getCaseFileKind(fileName: string): IntakeFileType | null {
  return extensionToKind[getCaseFileExtension(fileName)] ?? null;
}

export function isImageCaseFile(fileType: IntakeFileType) {
  return fileType === "image";
}

export function sanitizeCaseFileName(fileName: string) {
  const trimmed = fileName.trim().replace(/\s+/g, "-");
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "");

  return safe || "case-file";
}

export function validateCaseFileInput(file: {
  name: string;
  size: number;
}) {
  const fileType = getCaseFileKind(file.name);

  if (!fileType) {
    return {
      ok: false as const,
      message: `Unsupported file type. Allowed: ${allowedCaseFileExtensions.join(", ")}.`,
    };
  }

  if (file.size <= 0) {
    return { ok: false as const, message: "File is empty." };
  }

  if (file.size > MAX_CASE_FILE_SIZE_BYTES) {
    return {
      ok: false as const,
      message: "File is larger than the 2 GB case file limit.",
    };
  }

  return { ok: true as const, fileType };
}

export function buildCaseStoragePath(params: {
  labId: string;
  caseId: string;
  category: CaseFileCategory;
  fileName: string;
}) {
  const folder = caseFileCategoryConfig[params.category].folder;
  const safeName = sanitizeCaseFileName(params.fileName);
  const uniquePrefix = crypto.randomUUID();

  return `${params.labId}/${params.caseId}/${folder}/${uniquePrefix}-${safeName}`;
}
