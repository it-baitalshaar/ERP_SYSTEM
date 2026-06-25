import type { Item, StockLevelRow, StockMovementRow } from "@/lib/types";
import {
  items as mockItems,
  stockLevels as mockStockLevels,
  warehouses as mockWarehouses,
} from "@/lib/mock-data/inventory";

async function inventoryRequest<T>(
  url: string,
  init?: RequestInit
): Promise<{ data?: T; error?: string }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json.data };
}

async function fetchInventoryResource<T>(
  companyId: string,
  resource: string
): Promise<{ data: T[]; fromApi: boolean }> {
  const res = await fetch(`/api/inventory?companyId=${companyId}&resource=${resource}`);
  if (!res.ok) return { data: [], fromApi: false };
  const json = (await res.json()) as { data?: T[] };
  return { data: json.data ?? [], fromApi: true };
}

export async function fetchItems(companyId: string): Promise<Item[]> {
  const { data, fromApi } = await fetchInventoryResource<Item>(companyId, "items");
  if (fromApi) return data;
  return mockItems.filter((i) => i.company_id === companyId);
}

export async function fetchStockLevels(companyId: string): Promise<StockLevelRow[]> {
  const { data, fromApi } = await fetchInventoryResource<StockLevelRow>(
    companyId,
    "stock_levels"
  );
  if (fromApi) return data;

  const warehouseById = new Map(mockWarehouses.map((w) => [w.id, w]));
  const itemById = new Map(mockItems.filter((i) => i.company_id === companyId).map((i) => [i.id, i]));

  return mockStockLevels
    .filter((s) => itemById.has(s.item_id))
    .map((s, index) => {
      const item = itemById.get(s.item_id)!;
      const wh = warehouseById.get(s.warehouse_id);
      return {
        id: `mock-stock-${index}`,
        company_id: companyId,
        item_id: s.item_id,
        warehouse_id: s.warehouse_id,
        qty_on_hand: s.qty_on_hand,
        qty_reserved: s.qty_reserved,
        reorder_level: s.reorder_level,
        item_name: item.name,
        item_sku: item.sku,
        warehouse_name: wh?.name ?? "Warehouse",
        warehouse_code: wh?.code ?? "WH",
      };
    });
}

export async function fetchStockMovements(companyId: string): Promise<StockMovementRow[]> {
  const { data, fromApi } = await fetchInventoryResource<StockMovementRow>(
    companyId,
    "stock_movements"
  );
  if (fromApi) return data;
  return [];
}

export async function createItem(
  companyId: string,
  input: Omit<Item, "id" | "company_id">
): Promise<{ data?: Item; error?: string }> {
  return inventoryRequest<Item>("/api/inventory", {
    method: "POST",
    body: JSON.stringify({ resource: "items", company_id: companyId, ...input }),
  });
}

export async function updateItem(
  companyId: string,
  id: string,
  input: Partial<Item>
): Promise<{ data?: Item; error?: string }> {
  return inventoryRequest<Item>("/api/inventory", {
    method: "PATCH",
    body: JSON.stringify({ resource: "items", company_id: companyId, id, ...input }),
  });
}
