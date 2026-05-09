import { hasRole } from "@/lib/permissions";
import type {
  CaseFileCategory,
  CaseFileVisibility,
} from "@/lib/files/case-file-rules";
import type { AppRole } from "@/lib/constants/roles";

export type CaseFileAccessCase = {
  labId: string;
  doctorProfileId: string | null;
  assignedTechnicianId: string | null;
};

export type CaseFileAccessFile = {
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
  uploadedBy: string | null;
};

function isManagement(roles: AppRole[]) {
  return hasRole(roles, ["super_admin", "lab_owner", "lab_manager"]);
}

function isReception(roles: AppRole[]) {
  return hasRole(roles, ["reception"]);
}

function isAccountant(roles: AppRole[]) {
  return hasRole(roles, ["accountant"]);
}

function isDoctorOwnCase(userId: string, item: CaseFileAccessCase) {
  return item.doctorProfileId === userId;
}

function isAssignedTechnician(userId: string, item: CaseFileAccessCase) {
  return item.assignedTechnicianId === userId;
}

export function canUploadCaseFile(params: {
  roles: AppRole[];
  userId: string;
  item: CaseFileAccessCase;
  category: CaseFileCategory;
  visibility: CaseFileVisibility;
}) {
  if (isManagement(params.roles)) return true;

  if (isReception(params.roles)) {
    return params.category !== "invoices" && params.visibility !== "private_finance";
  }

  if (isAccountant(params.roles)) {
    return params.category === "invoices";
  }

  if (isDoctorOwnCase(params.userId, params.item)) {
    return (
      params.visibility === "doctor_visible" &&
      ["doctor_uploads", "scan_files", "photos"].includes(params.category)
    );
  }

  if (isAssignedTechnician(params.userId, params.item)) {
    return params.category !== "invoices" && params.visibility !== "private_finance";
  }

  return false;
}

export function canViewCaseFile(params: {
  roles: AppRole[];
  userId: string;
  item: CaseFileAccessCase;
  file: CaseFileAccessFile;
}) {
  if (isManagement(params.roles)) return true;

  if (isReception(params.roles)) {
    return params.file.visibility !== "private_finance";
  }

  if (isAccountant(params.roles)) {
    return params.file.category === "invoices";
  }

  if (isDoctorOwnCase(params.userId, params.item)) {
    return (
      params.file.visibility === "doctor_visible" ||
      params.file.uploadedBy === params.userId
    );
  }

  if (isAssignedTechnician(params.userId, params.item)) {
    return params.file.visibility !== "private_finance";
  }

  return false;
}

export function getAllowedUploadCategories(params: {
  roles: AppRole[];
  userId: string;
  item: CaseFileAccessCase;
}): CaseFileCategory[] {
  const allCategories: CaseFileCategory[] = [
    "doctor_uploads",
    "scan_files",
    "photos",
    "exocad_design",
    "design_versions",
    "cam_milling",
    "qc_photos",
    "delivery",
    "invoices",
  ];

  return allCategories.filter((category) =>
    canUploadCaseFile({
      ...params,
      category,
      visibility:
        category === "invoices" ||
        hasRole(params.roles, ["accountant"])
          ? "private_finance"
          : isDoctorOwnCase(params.userId, params.item)
            ? "doctor_visible"
            : "internal",
    }),
  );
}

export function getAllowedUploadVisibilities(params: {
  roles: AppRole[];
  userId: string;
  item: CaseFileAccessCase;
}): CaseFileVisibility[] {
  if (isManagement(params.roles)) {
    return ["internal", "doctor_visible", "private_finance"];
  }

  if (isAccountant(params.roles)) {
    return ["private_finance"];
  }

  if (isDoctorOwnCase(params.userId, params.item)) {
    return ["doctor_visible"];
  }

  if (isReception(params.roles) || isAssignedTechnician(params.userId, params.item)) {
    return ["internal", "doctor_visible"];
  }

  return [];
}
