import type { Item } from "@/lib/types";
import { items as mockItems } from "@/lib/mock-data/inventory";

/** Product catalog for purchase line items until Inventory module is live. */
export function getProcurementCatalog(_companyId: string): Item[] {
  return mockItems.map((item) => ({
    ...item,
    company_id: _companyId,
  }));
}
