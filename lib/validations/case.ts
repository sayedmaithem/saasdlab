import { z } from "zod";

export const workTypes = [
  "zircon_crown",
  "emax",
  "implant",
  "night_guard",
  "other",
] as const;

export const createCaseSchema = z.object({
  doctorId: z.uuid("Choose a doctor"),
  clinicId: z.uuid("Choose a clinic"),
  patientName: z.string().min(2, "Patient name is required").max(120),
  workType: z.string().min(1, "Work type is required").max(80),
  material: z.string().max(80).optional(),
  shade: z.string().max(24).optional(),
  unitsCount: z.coerce.number().int().min(1).max(64),
  toothNumbers: z.string().max(120).optional(),
  dueDate: z.string().date().optional().or(z.literal("")),
  isUrgent: z.boolean(),
  isRemake: z.boolean(),
  isWarranty: z.boolean(),
  requiresDoctorApproval: z.boolean(),
  physicalImpressionReceived: z.boolean(),
  preparationPhotoReceived: z.boolean(),
  implantSystem: z.string().max(120).optional(),
  scanBodyInfo: z.string().max(120).optional(),
  biteInfo: z.string().max(240).optional(),
  arch: z.enum(["", "upper", "lower", "both"]),
  complexity: z.enum(["simple", "standard", "complex"]),
  notes: z.string().max(1200).optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export function parseToothNumbers(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isInteger(item) && item > 0 && item <= 48);
}
