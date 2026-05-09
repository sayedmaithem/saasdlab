import type { CasePriority } from "@/types/app";
import type { ProductionStage } from "@/lib/constants/workflow";

export type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

export const priorityBadgeTone: Record<CasePriority, BadgeTone> = {
  low: "green",
  normal: "amber",
  urgent: "red",
};

export const stageBadgeTone: Record<ProductionStage, BadgeTone> = {
  received: "neutral",
  information_check: "amber",
  waiting_doctor_info: "amber",
  cad_design: "blue",
  design_review: "blue",
  doctor_approval: "amber",
  milling_printing: "blue",
  try_in: "blue",
  coloring: "blue",
  furnace: "blue",
  polishing: "blue",
  quality_control: "amber",
  ready_for_delivery: "green",
  out_for_delivery: "blue",
  delivered: "green",
  completed: "green",
  on_hold: "red",
  cancelled: "red",
};
