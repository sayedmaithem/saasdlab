export type { AppRole } from "@/lib/constants/roles";
export { appRoles } from "@/lib/constants/roles";

export const productionStages = [
  "received",
  "information_check",
  "waiting_doctor_info",
  "cad_design",
  "design_review",
  "doctor_approval",
  "milling_printing",
  "try_in",
  "coloring",
  "furnace",
  "polishing",
  "quality_control",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "completed",
  "on_hold",
  "cancelled",
] as const;

export type ProductionStage = (typeof productionStages)[number];

export const stageLabels: Record<ProductionStage, string> = {
  received: "Received",
  information_check: "Info check",
  waiting_doctor_info: "Waiting doctor",
  cad_design: "CAD design",
  design_review: "Design review",
  doctor_approval: "Doctor approval",
  milling_printing: "Milling / printing",
  try_in: "Try-in",
  coloring: "Coloring",
  furnace: "Furnace",
  polishing: "Polishing",
  quality_control: "Quality control",
  ready_for_delivery: "Ready delivery",
  out_for_delivery: "Out delivery",
  delivered: "Delivered",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export const stageOrder: Record<ProductionStage, number> =
  productionStages.reduce(
    (accumulator, stage, index) => ({ ...accumulator, [stage]: index }),
    {} as Record<ProductionStage, number>,
  );

export const intakeFileTypes = [
  "stl",
  "obj",
  "ply",
  "dicom",
  "pdf",
  "image",
  "zip",
  "exocad",
  "other",
] as const;

export type IntakeFileType = (typeof intakeFileTypes)[number];
