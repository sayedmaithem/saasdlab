import { z } from "zod";

export const clinicSchema = z.object({
  clinicId: z.uuid().optional().or(z.literal("")),
  name: z.string().min(2, "Clinic name is required").max(120),
  phone: z.string().max(40).optional(),
  email: z.email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().max(240).optional(),
  notes: z.string().max(1200).optional(),
  isActive: z.boolean(),
});

export type ClinicInput = z.infer<typeof clinicSchema>;
