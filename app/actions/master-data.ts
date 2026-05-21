"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  labOperationSchema,
  labMaterialSchema,
  priceGroupSchema,
  operationPriceSchema,
  technicianRateSchema,
  portalAccessTemplateSchema,
} from "@/lib/validations/master-data";

export type ActionResult = { ok: boolean; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const v = formData.get(key);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function getBoolean(formData: FormData, key: string) {
  const v = formData.get(key);
  return v === "on" || v === "true";
}

async function requireManagerAccess(): Promise<
  { labId: string; error: null } | { labId: null; error: string }
> {
  const session = await requireAuth();
  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    return { labId: null, error: "You do not have permission to manage catalog data." };
  }
  if (!session.activeLabId) {
    return { labId: null, error: "No active lab." };
  }
  return { labId: session.activeLabId, error: null };
}

const MASTER_DATA_PATH = "/command-center/master-data";

// ── Lab Operations ────────────────────────────────────────────────────────────

export async function upsertLabOperationAction(formData: FormData): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = labOperationSchema.safeParse({
    operationId: getString(formData, "operationId"),
    name: getString(formData, "name"),
    code: getString(formData, "code"),
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    defaultUnits: getNumber(formData, "defaultUnits", 1),
    isActive: getBoolean(formData, "isActive"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid operation data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    name: input.name,
    code: input.code || null,
    category: input.category || null,
    description: input.description || null,
    default_units: input.defaultUnits,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };

  const query = input.operationId
    ? supabase
        .from("lab_operations")
        .update(payload)
        .eq("id", input.operationId)
        .eq("lab_id", labId)
    : supabase.from("lab_operations").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/operations`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: input.operationId ? "Operation updated." : "Operation created." };
}

export async function deleteLabOperationAction(operationId: string): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lab_operations")
    .update({ is_active: false })
    .eq("id", operationId)
    .eq("lab_id", labId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/operations`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: "Operation deactivated." };
}

// ── Lab Materials ─────────────────────────────────────────────────────────────

export async function upsertLabMaterialAction(formData: FormData): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = labMaterialSchema.safeParse({
    materialId: getString(formData, "materialId"),
    name: getString(formData, "name"),
    code: getString(formData, "code"),
    category: getString(formData, "category"),
    shadeRequired: getBoolean(formData, "shadeRequired"),
    isActive: getBoolean(formData, "isActive"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid material data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    name: input.name,
    code: input.code || null,
    category: input.category || null,
    shade_required: input.shadeRequired,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };

  const query = input.materialId
    ? supabase
        .from("lab_materials")
        .update(payload)
        .eq("id", input.materialId)
        .eq("lab_id", labId)
    : supabase.from("lab_materials").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/materials`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: input.materialId ? "Material updated." : "Material created." };
}

export async function deleteLabMaterialAction(materialId: string): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lab_materials")
    .update({ is_active: false })
    .eq("id", materialId)
    .eq("lab_id", labId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/materials`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: "Material deactivated." };
}

// ── Price Groups ──────────────────────────────────────────────────────────────

export async function upsertPriceGroupAction(formData: FormData): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = priceGroupSchema.safeParse({
    priceGroupId: getString(formData, "priceGroupId"),
    name: getString(formData, "name"),
    description: getString(formData, "description"),
    isDefault: getBoolean(formData, "isDefault"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid price group data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    name: input.name,
    description: input.description || null,
    is_default: input.isDefault,
    is_active: input.isActive,
  };

  const query = input.priceGroupId
    ? supabase
        .from("price_groups")
        .update(payload)
        .eq("id", input.priceGroupId)
        .eq("lab_id", labId)
    : supabase.from("price_groups").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/price-groups`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: input.priceGroupId ? "Price group updated." : "Price group created." };
}

// ── Operation Prices ──────────────────────────────────────────────────────────

export async function upsertOperationPriceAction(formData: FormData): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = operationPriceSchema.safeParse({
    priceId: getString(formData, "priceId"),
    priceGroupId: getString(formData, "priceGroupId"),
    operationId: getString(formData, "operationId"),
    materialId: getString(formData, "materialId"),
    unitPrice: getNumber(formData, "unitPrice", 0),
    currency: getString(formData, "currency") || "IQD",
    effectiveFrom: getString(formData, "effectiveFrom"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid price data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    price_group_id: input.priceGroupId,
    operation_id: input.operationId,
    material_id: input.materialId || null,
    unit_price: input.unitPrice,
    currency: input.currency,
    effective_from: input.effectiveFrom,
    is_active: input.isActive,
  };

  const query = input.priceId
    ? supabase
        .from("operation_prices")
        .update(payload)
        .eq("id", input.priceId)
        .eq("lab_id", labId)
    : supabase.from("operation_prices").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/prices`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: input.priceId ? "Price updated." : "Price created." };
}

export async function deleteOperationPriceAction(priceId: string): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("operation_prices")
    .update({ is_active: false })
    .eq("id", priceId)
    .eq("lab_id", labId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/prices`);
  return { ok: true, message: "Price deactivated." };
}

// ── Technician Rates ──────────────────────────────────────────────────────────

export async function upsertTechnicianRateAction(formData: FormData): Promise<ActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = technicianRateSchema.safeParse({
    rateId: getString(formData, "rateId"),
    technicianId: getString(formData, "technicianId"),
    operationId: getString(formData, "operationId"),
    materialId: getString(formData, "materialId"),
    rateType: getString(formData, "rateType") || "per_unit",
    rateAmount: getNumber(formData, "rateAmount", 0),
    currency: getString(formData, "currency") || "IQD",
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid rate data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    technician_id: input.technicianId,
    operation_id: input.operationId || null,
    material_id: input.materialId || null,
    rate_type: input.rateType,
    rate_amount: input.rateAmount,
    currency: input.currency,
    is_active: input.isActive,
  };

  const query = input.rateId
    ? supabase
        .from("technician_operation_rates")
        .update(payload)
        .eq("id", input.rateId)
        .eq("lab_id", labId)
    : supabase.from("technician_operation_rates").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/technician-rates`);
  revalidatePath(MASTER_DATA_PATH);
  return { ok: true, message: input.rateId ? "Rate updated." : "Rate created." };
}

// ── Portal Access Templates ───────────────────────────────────────────────────

export async function upsertPortalAccessTemplateAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!hasRole(session.roles, ["super_admin", "lab_owner"])) {
    return { ok: false, message: "Only lab owners can manage portal access templates." };
  }
  if (!session.activeLabId) return { ok: false, message: "No active lab." };
  const labId: string = session.activeLabId;

  const permissionsRaw = getString(formData, "permissions");
  let permissions: Record<string, unknown> = {};
  try {
    if (permissionsRaw) permissions = JSON.parse(permissionsRaw) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "Invalid permissions JSON." };
  }

  const parsed = portalAccessTemplateSchema.safeParse({
    templateId: getString(formData, "templateId"),
    name: getString(formData, "name"),
    role: getString(formData, "role"),
    description: getString(formData, "description"),
    permissions,
    isDefault: getBoolean(formData, "isDefault"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid template data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    name: input.name,
    role: input.role,
    description: input.description || null,
    permissions: input.permissions,
    is_default: input.isDefault,
  };

  const query = input.templateId
    ? supabase
        .from("portal_access_templates")
        .update(payload)
        .eq("id", input.templateId)
        .eq("lab_id", labId)
    : supabase.from("portal_access_templates").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`${MASTER_DATA_PATH}/portal-access`);
  revalidatePath(MASTER_DATA_PATH);
  return {
    ok: true,
    message: input.templateId ? "Template updated." : "Template created.",
  };
}
