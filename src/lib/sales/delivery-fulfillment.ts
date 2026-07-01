import type { LineItem } from "@/lib/types";

export interface LineFulfillment {
  item_id: string;
  item_name: string;
  invoiced_qty: number;
  paid_qty: number;
  delivered_qty: number;
  deliverable_qty: number;
  undelivered_qty: number;
}

/** Sum delivered qty per item from posted delivery note lines. */
export function sumDeliveredByItem(
  deliveryNotes: { status: string; lines: LineItem[] }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const dn of deliveryNotes) {
    if (dn.status !== "posted") continue;
    for (const line of dn.lines) {
      if (!line.item_id) continue;
      map.set(line.item_id, (map.get(line.item_id) ?? 0) + line.qty);
    }
  }
  return map;
}

export function buildLineFulfillment(
  invoiceLines: LineItem[],
  paidLineQty: Record<string, number>,
  deliveredByItem: Map<string, number>,
  enforcePaidQty: boolean
): LineFulfillment[] {
  return invoiceLines
    .filter((l) => l.item_id)
    .map((line) => {
      const invoiced_qty = line.qty;
      const paid_qty = paidLineQty[line.item_id] ?? 0;
      const delivered_qty = deliveredByItem.get(line.item_id) ?? 0;
      const undelivered_qty = Math.max(0, invoiced_qty - delivered_qty);

      let deliverable_qty: number;
      if (enforcePaidQty) {
        deliverable_qty = Math.max(0, paid_qty - delivered_qty);
      } else {
        deliverable_qty = undelivered_qty;
      }

      return {
        item_id: line.item_id,
        item_name: line.item_name,
        invoiced_qty,
        paid_qty,
        delivered_qty,
        deliverable_qty,
        undelivered_qty,
      };
    });
}

export function parsePaidLineQty(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(val);
    if (n > 0) out[key] = n;
  }
  return out;
}
