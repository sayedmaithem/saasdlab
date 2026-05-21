import { productionStages, type ProductionStage } from "@/lib/constants/workflow";

export const qcResults = ["passed", "needs_adjustment", "failed"] as const;
export type QcResult = (typeof qcResults)[number];

export const remakeResponsibilities = [
  "lab_error",
  "doctor_error",
  "scan_issue",
  "patient_request",
  "shade_issue",
  "margin_issue",
  "fracture",
  "occlusion_issue",
  "unknown",
] as const;
export type RemakeResponsibility = (typeof remakeResponsibilities)[number];

export type QcChecklistItem = {
  key: string;
  label: string;
};

const zirconChecklist: QcChecklistItem[] = [
  { key: "shade_checked", label: "Shade checked" },
  { key: "margin_checked", label: "Margin checked" },
  { key: "contact_checked", label: "Contact checked" },
  { key: "occlusion_checked", label: "Occlusion checked" },
  { key: "surface_polished", label: "Surface polished" },
  { key: "no_cracks", label: "No cracks" },
  { key: "photos_uploaded", label: "Photos uploaded" },
  { key: "final_approval", label: "Final approval" },
];

const emaxChecklist: QcChecklistItem[] = [
  { key: "shade_checked", label: "Shade checked" },
  { key: "translucency_checked", label: "Translucency checked" },
  { key: "contact_checked", label: "Contact checked" },
  { key: "margin_checked", label: "Margin checked" },
  { key: "surface_checked", label: "Surface checked" },
  { key: "final_approval", label: "Final approval" },
];

const implantChecklist: QcChecklistItem[] = [
  { key: "fit_checked", label: "Fit checked" },
  { key: "screw_channel_checked", label: "Screw channel checked" },
  { key: "contact_checked", label: "Contact checked" },
  { key: "occlusion_checked", label: "Occlusion checked" },
  { key: "passive_fit_checked", label: "Passive fit checked" },
  { key: "final_approval", label: "Final approval" },
];

const genericChecklist: QcChecklistItem[] = [
  { key: "contact_checked", label: "Contact checked" },
  { key: "margin_checked", label: "Margin checked" },
  { key: "surface_checked", label: "Surface checked" },
  { key: "photos_uploaded", label: "Photos uploaded" },
  { key: "final_approval", label: "Final approval" },
];

export function getQcChecklistForWorkType(workType: string) {
  const normalized = workType.toLowerCase();

  if (normalized.includes("implant")) return implantChecklist;
  if (normalized.includes("emax") || normalized.includes("e-max")) return emaxChecklist;
  if (normalized.includes("zircon")) return zirconChecklist;

  return genericChecklist;
}

export function getPreviousProductionStage(stage: ProductionStage) {
  const index = productionStages.indexOf(stage);
  const previous = productionStages[Math.max(index - 1, 0)];

  return previous === "waiting_doctor_info" ? "information_check" : previous;
}

export function isQcResult(value: string): value is QcResult {
  return qcResults.includes(value as QcResult);
}

export function isRemakeResponsibility(value: string): value is RemakeResponsibility {
  return remakeResponsibilities.includes(value as RemakeResponsibility);
}
