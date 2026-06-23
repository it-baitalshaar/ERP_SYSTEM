import { lineSubtotal } from "@/lib/sales/calculations";
import type { Item, LineItem } from "@/lib/types";

export const BELOW_COST_WARNING_FLAG = "feat_below_cost_warning";

export interface BelowCostLineWarning {
  index: number;
  item_id: string;
  item_name: string;
  cost_price: number;
  sell_unit_price: number;
  discount_pct: number;
  loss_per_unit: number;
}

/** Net unit sell price after line discount, before VAT. */
export function effectiveSellUnitPrice(line: LineItem): number {
  if (line.qty <= 0) return line.unit_price;
  return lineSubtotal(line) / line.qty;
}

export function findBelowCostLines(
  lines: LineItem[],
  catalog: Item[]
): BelowCostLineWarning[] {
  const costById = new Map(catalog.map((i) => [i.id, i.cost_price ?? 0]));

  const warnings: BelowCostLineWarning[] = [];

  lines.forEach((line, index) => {
    if (!line.item_id?.trim()) return;
    const cost = costById.get(line.item_id);
    if (cost === undefined || cost <= 0) return;

    const sellUnit = effectiveSellUnitPrice(line);
    if (sellUnit + 0.0001 < cost) {
      warnings.push({
        index,
        item_id: line.item_id,
        item_name: line.item_name,
        cost_price: cost,
        sell_unit_price: Math.round(sellUnit * 100) / 100,
        discount_pct: line.discount_pct ?? 0,
        loss_per_unit: Math.round((cost - sellUnit) * 100) / 100,
      });
    }
  });

  return warnings;
}
