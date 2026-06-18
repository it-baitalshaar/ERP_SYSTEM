import type { Item } from "@/lib/types";
import { items as mockItems } from "@/lib/mock-data/inventory";

/** Product catalog for sales line items until Inventory module is live. */
export function getSalesCatalog(_companyId: string): Item[] {
  return mockItems.map((item) => ({
    ...item,
    company_id: _companyId,
  }));
}
