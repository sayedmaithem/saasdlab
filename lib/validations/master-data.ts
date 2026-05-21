import { z } from "zod";

// ── Lab Operations ────────────────────────────────────────────────────────────

export const labOperationSchema = z.object({
  operationId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(120),
  code: z.string().max(40).optional(),
  category: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  defaultUnits: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type LabOperationInput = z.infer<typeof labOperationSchema>;

// ── Lab Materials ────────────────────────────────────────────────────────────

export const labMaterialSchema = z.object({
  materialId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(120),
  code: z.string().max(40).optional(),
  category: z.string().max(80).optional(),
  shadeRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type LabMaterialInput = z.infer<typeof labMaterialSchema>;

// ── Price Groups ─────────────────────────────────────────────────────────────

export const priceGroupSchema = z.object({
  priceGroupId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type PriceGroupInput = z.infer<typeof priceGroupSchema>;

// ── Operation Prices ─────────────────────────────────────────────────────────

export const operationPriceSchema = z.object({
  priceId: z.string().uuid().optional().or(z.literal("")),
  priceGroupId: z.string().uuid("Select a price group"),
  operationId: z.string().uuid("Select an operation"),
  materialId: z.string().uuid().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  currency: z.string().min(1).max(10).default("IQD"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
  isActive: z.boolean().default(true),
});

export type OperationPriceInput = z.infer<typeof operationPriceSchema>;

// ── Technician Rates ─────────────────────────────────────────────────────────

export const technicianRateSchema = z.object({
  rateId: z.string().uuid().optional().or(z.literal("")),
  technicianId: z.string().uuid("Select a technician"),
  operationId: z.string().uuid().optional().or(z.literal("")),
  materialId: z.string().uuid().optional().or(z.literal("")),
  rateType: z.enum(["per_unit", "fixed", "hourly"]).default("per_unit"),
  rateAmount: z.coerce.number().min(0, "Rate must be 0 or more"),
  currency: z.string().min(1).max(10).default("IQD"),
  isActive: z.boolean().default(true),
});

export type TechnicianRateInput = z.infer<typeof technicianRateSchema>;

// ── Portal Access Templates ──────────────────────────────────────────────────

export const portalAccessTemplateSchema = z.object({
  templateId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(120),
  role: z.string().min(1, "Role is required").max(60),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.unknown()).default({}),
  isDefault: z.boolean().default(false),
});

export type PortalAccessTemplateInput = z.infer<typeof portalAccessTemplateSchema>;
