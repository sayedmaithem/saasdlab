import { z } from "zod";

export const createDoctorSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  phone: z.string().max(40).optional(),
  email: z.email("Enter a valid email").optional().or(z.literal("")),
  clinicId: z.uuid("Choose a clinic").optional().or(z.literal("")),
  address: z.string().max(240).optional(),
  isVip: z.boolean(),
  notes: z.string().max(1200).optional(),
  paymentTerms: z.string().max(120).optional(),
  defaultPriceGroup: z.string().max(80).optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

export const upsertPriceSchema = z.object({
  doctorId: z.uuid(),
  priceId: z.uuid().optional().or(z.literal("")),
  workType: z.string().min(2, "Work type is required").max(120),
  material: z.string().max(120).optional(),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  effectiveFrom: z.string().date(),
  isActive: z.boolean(),
});

export type UpsertPriceInput = z.infer<typeof upsertPriceSchema>;
