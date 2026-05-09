import type { CreateCaseInput } from "@/lib/validations/case";

export type UploadedFileSignal = {
  category: string;
  fileType?: string | null;
};

export type MissingInformationResult = {
  status: "complete" | "missing";
  requiredMissing: string[];
  recommendedMissing: string[];
  message: string | null;
};

function hasScanFile(files: UploadedFileSignal[]) {
  return files.some((file) =>
    ["scan", "intake"].includes(file.category) ||
    ["stl", "obj", "ply"].includes(file.fileType ?? ""),
  );
}

function hasDicom(files: UploadedFileSignal[]) {
  return files.some((file) => file.fileType === "dicom");
}

export function checkMissingInformation(
  caseData: CreateCaseInput,
  uploadedFiles: UploadedFileSignal[] = [],
): MissingInformationResult {
  const requiredMissing: string[] = [];
  const recommendedMissing: string[] = [];
  const toothNumbers = caseData.toothNumbers
    ?.split(/[,\s]+/)
    .filter(Boolean) ?? [];

  if (!caseData.doctorId) requiredMissing.push("doctor_id");
  if (!caseData.patientName) requiredMissing.push("patient_name");
  if (!caseData.unitsCount) requiredMissing.push("units_count");
  if (!caseData.dueDate) requiredMissing.push("due_date");

  if (caseData.workType !== "night_guard") {
    if (!caseData.shade) requiredMissing.push("shade");
    if (!caseData.material) requiredMissing.push("material");
    if (toothNumbers.length === 0) requiredMissing.push("tooth_numbers");
    if (!hasScanFile(uploadedFiles) && !caseData.physicalImpressionReceived) {
      requiredMissing.push("scan_file_or_physical_impression");
    }
  }

  if (caseData.workType === "emax" && !caseData.preparationPhotoReceived) {
    recommendedMissing.push("preparation_photo");
  }

  if (caseData.workType === "implant") {
    if (!caseData.implantSystem) requiredMissing.push("implant_system");
    if (!caseData.scanBodyInfo) requiredMissing.push("scan_body_info");
    if (!caseData.biteInfo) requiredMissing.push("bite_info");
    if (!hasDicom(uploadedFiles)) recommendedMissing.push("dicom");
  }

  if (caseData.workType === "night_guard") {
    if (!caseData.arch) requiredMissing.push("arch");
    if (!caseData.biteInfo) requiredMissing.push("bite_info");
  }

  return {
    status: requiredMissing.length > 0 ? "missing" : "complete",
    requiredMissing,
    recommendedMissing,
    message:
      requiredMissing.length > 0
        ? "This case is waiting for doctor information."
        : null,
  };
}
