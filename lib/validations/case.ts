import { z } from "zod";

export const createCaseSchema = z.object({
  patientDisplay: z.string().min(2, "Patient display name is required").max(80),
  doctorId: z.uuid("Choose a doctor"),
  clinicId: z.uuid("Choose a clinic"),
  restorationType: z.string().min(2, "Restoration type is required").max(80),
  shade: z.string().max(24).optional(),
  toothNumbers: z
    .string()
    .min(1, "Enter at least one tooth number")
    .max(80)
    .refine((value) => {
      const items = value
        .split(/[,\s]+/)
        .map((item) => Number.parseInt(item, 10))
        .filter((item) => Number.isInteger(item) && item > 0 && item <= 48);

      return items.length > 0;
    }, "Enter valid tooth numbers"),
  dueDate: z.string().date().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "urgent"]),
  notes: z.string().max(1200).optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
