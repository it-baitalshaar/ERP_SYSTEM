import type { StockLevelRow } from "@/lib/types";

export const PRODUCT_WAREHOUSE_AVAILABILITY_FLAG = "feat_product_warehouse_availability";

export interface WarehouseAvailability {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
}

/** Group stock rows by item_id, sorted by available qty descending. */
export function indexStockByItem(
  stock: StockLevelRow[]
): Map<string, WarehouseAvailability[]> {
  const map = new Map<string, WarehouseAvailability[]>();

  for (const row of stock) {
    const qty_available = Math.max(0, row.qty_on_hand - row.qty_reserved);
    const entry: WarehouseAvailability = {
      warehouse_id: row.warehouse_id,
      warehouse_code: row.warehouse_code,
      warehouse_name: row.warehouse_name,
      qty_on_hand: row.qty_on_hand,
      qty_reserved: row.qty_reserved,
      qty_available,
    };
    const list = map.get(row.item_id) ?? [];
    list.push(entry);
    map.set(row.item_id, list);
  }

  for (const [itemId, list] of map) {
    list.sort((a, b) => b.qty_available - a.qty_available);
    map.set(itemId, list);
  }

  return map;
}

/** One-line summary for inline display under the product field. */
export function formatAvailabilitySummary(warehouses: WarehouseAvailability[]): string {
  if (!warehouses.length) return "No stock in any warehouse";

  const withStock = warehouses.filter((w) => w.qty_available > 0);
  if (!withStock.length) return "Out of stock in all warehouses";

  return withStock
    .map((w) => `${w.warehouse_code}: ${formatQty(w.qty_available)}`)
    .join(" · ");
}

export function formatQty(qty: number): string {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
}
