import { documentTotal } from "@/lib/sales/calculations";
import { detectPriceVariance } from "@/lib/procurement/mrn-variance";
import type { LineItem, PriceUpdateLine } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

function lineKey(line: Pick<LineItem, "item_id" | "item_name">): string {
  return line.item_id || line.item_name.trim().toLowerCase();
}

export { detectPriceVariance };

export async function updateLpoLinesFromReceivedPrices(
  db: Db,
  companyId: string,
  purchaseOrderId: string,
  priceUpdates: PriceUpdateLine[]
): Promise<void> {
  const { data: po, error } = await db
    .from("purchase_orders")
    .select("lines")
    .eq("id", purchaseOrderId)
    .eq("company_id", companyId)
    .single();

  if (error || !po) throw new Error("LPO not found");

  const lines = (po.lines as LineItem[]) ?? [];
  const updateMap = new Map(
    priceUpdates.map((u) => [u.item_id || u.item_name.trim().toLowerCase(), u.new_unit_price])
  );

  const newLines = lines.map((line) => {
    const key = lineKey(line);
    const newPrice = updateMap.get(key);
    if (newPrice === undefined) return line;
    return { ...line, unit_price: newPrice };
  });

  const { error: updateError } = await db
    .from("purchase_orders")
    .update({
      lines: newLines,
      total: documentTotal(newLines),
    })
    .eq("id", purchaseOrderId)
    .eq("company_id", companyId);

  if (updateError) throw new Error(updateError.message);
}
