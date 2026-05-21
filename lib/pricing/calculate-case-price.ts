import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PriceResult = {
  unitPrice: number;
  subtotal: number;
  currency: string;
  priceGroupName: string | null;
  missingPrice: boolean;
};

export type CasePriceCalculation = {
  lines: PriceResult[];
  subtotal: number;
  currency: string;
  missingPrices: boolean;
  total: number;
};

type PriceLookupParams = {
  labId: string;
  priceGroupId: string;
  operationId: string;
  materialId?: string | null;
  unitsCount: number;
};

// ── Internal ──────────────────────────────────────────────────────────────────

type PriceRow = {
  unit_price: number;
  currency: string;
  operation_id: string;
  material_id: string | null;
};

type PriceGroupRow = {
  id: string;
  name: string;
};

async function fetchBestPrice(
  labId: string,
  priceGroupId: string,
  operationId: string,
  materialId: string | null | undefined,
): Promise<{ unitPrice: number; currency: string } | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("operation_prices")
    .select("unit_price, currency, operation_id, material_id")
    .eq("lab_id", labId)
    .eq("price_group_id", priceGroupId)
    .eq("operation_id", operationId)
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .returns<PriceRow[]>();

  if (!data || data.length === 0) return null;

  // Prefer exact material match, fall back to any-material price (material_id IS NULL)
  if (materialId) {
    const exact = data.find((row) => row.material_id === materialId);
    if (exact) return { unitPrice: exact.unit_price, currency: exact.currency };
  }

  const fallback = data.find((row) => row.material_id === null);
  if (fallback) return { unitPrice: fallback.unit_price, currency: fallback.currency };

  // Use first price found even if material doesn't match — better than nothing
  return data[0] ? { unitPrice: data[0].unit_price, currency: data[0].currency } : null;
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * Calculate the price for a single case line.
 * Never fabricates a price — returns missingPrice: true when no price found.
 */
export async function calculateCaseLinePrice(
  params: PriceLookupParams,
): Promise<PriceResult> {
  const priceGroupName = await (async () => {
    if (!hasSupabaseEnv()) return null;
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("price_groups")
      .select("id, name")
      .eq("id", params.priceGroupId)
      .eq("lab_id", params.labId)
      .maybeSingle<PriceGroupRow>();
    return data?.name ?? null;
  })();

  const found = await fetchBestPrice(
    params.labId,
    params.priceGroupId,
    params.operationId,
    params.materialId,
  );

  if (!found) {
    return {
      unitPrice: 0,
      subtotal: 0,
      currency: "IQD",
      priceGroupName,
      missingPrice: true,
    };
  }

  return {
    unitPrice: found.unitPrice,
    subtotal: found.unitPrice * params.unitsCount,
    currency: found.currency,
    priceGroupName,
    missingPrice: false,
  };
}

/**
 * Resolves the default price group for a doctor and calculates a price.
 * Used at case creation when no explicit price group is provided.
 *
 * Matching priority:
 *   1. Operation + material exact match in doctor's price group
 *   2. Operation + any-material in doctor's price group
 *   3. missingPrice: true (never returns a fabricated price)
 */
export async function calculateCasePriceForDoctor(params: {
  labId: string;
  doctorId: string;
  operationId: string | null;
  materialId?: string | null;
  unitsCount: number;
}): Promise<CasePriceCalculation> {
  const empty: CasePriceCalculation = {
    lines: [],
    subtotal: 0,
    currency: "IQD",
    missingPrices: true,
    total: 0,
  };

  if (!hasSupabaseEnv() || !params.operationId) return empty;

  const supabase = await createSupabaseServerClient();

  // Resolve doctor's price group (column is default_price_group, not price_group_id)
  const { data: doctor } = await supabase
    .from("doctors")
    .select("default_price_group")
    .eq("id", params.doctorId)
    .eq("lab_id", params.labId)
    .maybeSingle<{ default_price_group: string | null }>();

  const priceGroupId = doctor?.default_price_group;
  if (!priceGroupId) return empty;

  const line = await calculateCaseLinePrice({
    labId: params.labId,
    priceGroupId,
    operationId: params.operationId,
    materialId: params.materialId,
    unitsCount: params.unitsCount,
  });

  const subtotal = line.subtotal;

  return {
    lines: [line],
    subtotal,
    currency: line.currency,
    missingPrices: line.missingPrice,
    total: subtotal,
  };
}
