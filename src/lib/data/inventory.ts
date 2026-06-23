import type { Item, StockLevelRow, StockMovementRow } from "@/lib/types";
import { items as mockItems } from "@/lib/mock-data/inventory";

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
  return [];
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
