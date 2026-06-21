import type { Item } from "@/lib/types";
import { fetchItems } from "@/lib/data/inventory";
import { items as mockItems } from "@/lib/mock-data/inventory";

/** Product catalog for purchase line items — DB first, mock fallback. */
export async function getProcurementCatalog(companyId: string): Promise<Item[]> {
  const items = await fetchItems(companyId);
  if (items.length) return items;
  return mockItems.map((item) => ({ ...item, company_id: companyId }));
}
