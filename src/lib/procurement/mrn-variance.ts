import type { LineItem, PriceUpdateLine } from "@/lib/types";

const PRICE_TOLERANCE = 0.02;

function lineKey(line: Pick<LineItem, "item_id" | "item_name">): string {
  return line.item_id || line.item_name.trim().toLowerCase();
}

export function detectPriceVariance(
  lpoLines: LineItem[],
  priceUpdates: PriceUpdateLine[]
): PriceUpdateLine[] {
  const lpoMap = new Map(lpoLines.map((l) => [lineKey(l), l]));
  return priceUpdates.filter((u) => {
    const lpo = lpoMap.get(u.item_id || u.item_name.trim().toLowerCase());
    const oldPrice = lpo?.unit_price ?? u.old_unit_price;
    return Math.abs(u.new_unit_price - oldPrice) > PRICE_TOLERANCE;
  });
}
