import { findBelowCostLines } from "@/lib/sales/below-cost";
import { BELOW_COST_WARNING_FLAG } from "@/lib/sales/below-cost";
import { isCompanyFeatureEnabled } from "@/lib/server/feature-flags";
import type { LineItem } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

export class BelowCostError extends Error {
  readonly code = "below_cost_warning" as const;
  readonly warnings: ReturnType<typeof findBelowCostLines>;

  constructor(warnings: ReturnType<typeof findBelowCostLines>) {
    const names = warnings.map((w) => w.item_name).join(", ");
    super(
      `Selling below purchase cost: ${names}. Confirm to proceed or update selling prices.`
    );
    this.warnings = warnings;
  }
}

export async function assertSalesLinesNotBelowCost(
  db: Db,
  companyId: string,
  lines: LineItem[],
  acknowledged: boolean
): Promise<void> {
  const enabled = await isCompanyFeatureEnabled(db, companyId, BELOW_COST_WARNING_FLAG);
  if (!enabled || acknowledged) return;

  const itemIds = [...new Set(lines.map((l) => l.item_id).filter(Boolean))];
  if (!itemIds.length) return;

  const { data: items } = await db
    .from("items")
    .select("id, name, sku, cost_price, unit_price, base_uom")
    .eq("company_id", companyId)
    .in("id", itemIds);

  const catalog = (items ?? []).map((row) => ({
    id: String(row.id),
    company_id: companyId,
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    category_id: "",
    base_uom: String(row.base_uom ?? "pcs"),
    uom_conversions: [],
    is_batch_managed: false,
    reorder_level: 0,
    cost_price: Number(row.cost_price ?? 0),
    unit_price: Number(row.unit_price ?? 0),
  }));

  const warnings = findBelowCostLines(lines, catalog);
  if (warnings.length) {
    throw new BelowCostError(warnings);
  }
}
