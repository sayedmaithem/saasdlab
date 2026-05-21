import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { AuthSessionContext } from "@/types/app";

// ── Types ────────────────────────────────────────────────────────────────────

export type LabOperation = {
  id: string;
  labId: string;
  name: string;
  code: string | null;
  category: string | null;
  description: string | null;
  defaultUnits: number;
  isActive: boolean;
  sortOrder: number;
};

export type LabMaterial = {
  id: string;
  labId: string;
  name: string;
  code: string | null;
  category: string | null;
  shadeRequired: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type PriceGroup = {
  id: string;
  labId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type OperationPrice = {
  id: string;
  labId: string;
  priceGroupId: string | null;
  operationId: string | null;
  materialId: string | null;
  unitPrice: number;
  currency: string;
  effectiveFrom: string;
  isActive: boolean;
  // joined display names
  priceGroupName: string | null;
  operationName: string | null;
  materialName: string | null;
};

export type TechnicianRate = {
  id: string;
  labId: string;
  technicianId: string;
  operationId: string | null;
  materialId: string | null;
  rateType: "per_unit" | "fixed" | "hourly";
  rateAmount: number;
  currency: string;
  isActive: boolean;
  // joined display names
  technicianName: string | null;
  operationName: string | null;
  materialName: string | null;
};

export type PortalAccessTemplate = {
  id: string;
  labId: string;
  name: string;
  role: string;
  description: string | null;
  permissions: Record<string, unknown>;
  isDefault: boolean;
};

export type MasterDataOverview = {
  operationsCount: number;
  materialsCount: number;
  priceGroupsCount: number;
  operationPricesCount: number;
  technicianRatesCount: number;
  portalTemplatesCount: number;
  hasOperations: boolean;
  hasMaterials: boolean;
  hasPriceGroups: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireLab(session: AuthSessionContext): string {
  if (!session.activeLabId) throw new Error("No active lab.");
  return session.activeLabId;
}

// ── Public functions ─────────────────────────────────────────────────────────

export async function getMasterDataOverview(
  session: AuthSessionContext,
): Promise<MasterDataOverview> {
  const empty: MasterDataOverview = {
    operationsCount: 0,
    materialsCount: 0,
    priceGroupsCount: 0,
    operationPricesCount: 0,
    technicianRatesCount: 0,
    portalTemplatesCount: 0,
    hasOperations: false,
    hasMaterials: false,
    hasPriceGroups: false,
  };

  if (!hasSupabaseEnv()) return empty;
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const [ops, mats, groups, prices, rates, templates] = await Promise.all([
    supabase
      .from("lab_operations")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("lab_materials")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("price_groups")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("operation_prices")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("technician_operation_rates")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("portal_access_templates")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId),
  ]);

  const operationsCount = ops.count ?? 0;
  const materialsCount = mats.count ?? 0;
  const priceGroupsCount = groups.count ?? 0;

  return {
    operationsCount,
    materialsCount,
    priceGroupsCount,
    operationPricesCount: prices.count ?? 0,
    technicianRatesCount: rates.count ?? 0,
    portalTemplatesCount: templates.count ?? 0,
    hasOperations: operationsCount > 0,
    hasMaterials: materialsCount > 0,
    hasPriceGroups: priceGroupsCount > 0,
  };
}

export async function getLabOperations(session: AuthSessionContext): Promise<LabOperation[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lab_operations")
    .select("id, lab_id, name, code, category, description, default_units, is_active, sort_order")
    .eq("lab_id", labId)
    .order("sort_order")
    .order("name")
    .returns<
      Array<{
        id: string;
        lab_id: string;
        name: string;
        code: string | null;
        category: string | null;
        description: string | null;
        default_units: number;
        is_active: boolean;
        sort_order: number;
      }>
    >();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description,
    defaultUnits: row.default_units,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function getLabMaterials(session: AuthSessionContext): Promise<LabMaterial[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lab_materials")
    .select("id, lab_id, name, code, category, shade_required, is_active, sort_order")
    .eq("lab_id", labId)
    .order("sort_order")
    .order("name")
    .returns<
      Array<{
        id: string;
        lab_id: string;
        name: string;
        code: string | null;
        category: string | null;
        shade_required: boolean;
        is_active: boolean;
        sort_order: number;
      }>
    >();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    name: row.name,
    code: row.code,
    category: row.category,
    shadeRequired: row.shade_required,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function getPriceGroups(session: AuthSessionContext): Promise<PriceGroup[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("price_groups")
    .select("id, lab_id, name, description, is_default, is_active")
    .eq("lab_id", labId)
    .order("name")
    .returns<
      Array<{
        id: string;
        lab_id: string;
        name: string;
        description: string | null;
        is_default: boolean;
        is_active: boolean;
      }>
    >();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    isActive: row.is_active,
  }));
}

export async function getOperationPrices(
  session: AuthSessionContext,
  priceGroupId?: string,
): Promise<OperationPrice[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  // Fetch prices + related names in parallel
  const pricesQuery = supabase
    .from("operation_prices")
    .select(
      "id, lab_id, price_group_id, operation_id, material_id, unit_price, currency, effective_from, is_active",
    )
    .eq("lab_id", labId)
    .eq("is_active", true)
    .order("effective_from", { ascending: false });

  if (priceGroupId) pricesQuery.eq("price_group_id", priceGroupId);

  const [{ data: prices, error: pricesError }, ops, mats, groups] = await Promise.all([
    pricesQuery.returns<
      Array<{
        id: string;
        lab_id: string;
        price_group_id: string | null;
        operation_id: string | null;
        material_id: string | null;
        unit_price: number;
        currency: string;
        effective_from: string;
        is_active: boolean;
      }>
    >(),
    supabase
      .from("lab_operations")
      .select("id, name")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; name: string }>>(),
    supabase
      .from("lab_materials")
      .select("id, name")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; name: string }>>(),
    supabase
      .from("price_groups")
      .select("id, name")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; name: string }>>(),
  ]);

  if (pricesError) throw new Error(pricesError.message);

  const opsMap = new Map((ops.data ?? []).map((o) => [o.id, o.name]));
  const matsMap = new Map((mats.data ?? []).map((m) => [m.id, m.name]));
  const groupsMap = new Map((groups.data ?? []).map((g) => [g.id, g.name]));

  return (prices ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    priceGroupId: row.price_group_id,
    operationId: row.operation_id,
    materialId: row.material_id,
    unitPrice: row.unit_price,
    currency: row.currency,
    effectiveFrom: row.effective_from,
    isActive: row.is_active,
    priceGroupName: row.price_group_id ? (groupsMap.get(row.price_group_id) ?? null) : null,
    operationName: row.operation_id ? (opsMap.get(row.operation_id) ?? null) : null,
    materialName: row.material_id ? (matsMap.get(row.material_id) ?? null) : null,
  }));
}

export async function getTechnicianRates(
  session: AuthSessionContext,
  technicianId?: string,
): Promise<TechnicianRate[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const ratesQuery = supabase
    .from("technician_operation_rates")
    .select(
      "id, lab_id, technician_id, operation_id, material_id, rate_type, rate_amount, currency, is_active",
    )
    .eq("lab_id", labId)
    .eq("is_active", true);

  if (technicianId) ratesQuery.eq("technician_id", technicianId);

  const [{ data: rates, error: ratesError }, ops, mats, techs] = await Promise.all([
    ratesQuery.returns<
      Array<{
        id: string;
        lab_id: string;
        technician_id: string;
        operation_id: string | null;
        material_id: string | null;
        rate_type: "per_unit" | "fixed" | "hourly";
        rate_amount: number;
        currency: string;
        is_active: boolean;
      }>
    >(),
    supabase
      .from("lab_operations")
      .select("id, name")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; name: string }>>(),
    supabase
      .from("lab_materials")
      .select("id, name")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; name: string }>>(),
    supabase
      .from("technicians")
      .select("id, profiles(full_name)")
      .eq("lab_id", labId)
      .returns<Array<{ id: string; profiles: { full_name: string | null } | null }>>(),
  ]);

  if (ratesError) throw new Error(ratesError.message);

  const opsMap = new Map((ops.data ?? []).map((o) => [o.id, o.name]));
  const matsMap = new Map((mats.data ?? []).map((m) => [m.id, m.name]));
  const techsMap = new Map(
    (techs.data ?? []).map((t) => [t.id, t.profiles?.full_name ?? null]),
  );

  return (rates ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    technicianId: row.technician_id,
    operationId: row.operation_id,
    materialId: row.material_id,
    rateType: row.rate_type,
    rateAmount: row.rate_amount,
    currency: row.currency,
    isActive: row.is_active,
    technicianName: techsMap.get(row.technician_id) ?? null,
    operationName: row.operation_id ? (opsMap.get(row.operation_id) ?? null) : null,
    materialName: row.material_id ? (matsMap.get(row.material_id) ?? null) : null,
  }));
}

export async function getPortalAccessTemplates(
  session: AuthSessionContext,
): Promise<PortalAccessTemplate[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("portal_access_templates")
    .select("id, lab_id, name, role, description, permissions, is_default")
    .eq("lab_id", labId)
    .order("role")
    .order("name")
    .returns<
      Array<{
        id: string;
        lab_id: string;
        name: string;
        role: string;
        description: string | null;
        permissions: Record<string, unknown>;
        is_default: boolean;
      }>
    >();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    name: row.name,
    role: row.role,
    description: row.description,
    permissions: row.permissions,
    isDefault: row.is_default,
  }));
}
