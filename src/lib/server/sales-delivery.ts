import {
  buildLineFulfillment,
  parsePaidLineQty,
  sumDeliveredByItem,
  type LineFulfillment,
} from "@/lib/sales/delivery-fulfillment";
import type { LineItem } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

export type { LineFulfillment };

export async function getInvoiceFulfillment(
  db: Db,
  companyId: string,
  invoiceId: string,
  enforcePaidQty: boolean
): Promise<LineFulfillment[]> {
  const { data: invoice } = await db
    .from("tax_invoices")
    .select("lines, paid_line_qty")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .single();

  if (!invoice) throw new Error("Invoice not found");

  const { data: notes } = await db
    .from("delivery_notes")
    .select("status, lines")
    .eq("invoice_id", invoiceId)
    .eq("company_id", companyId);

  const lines = (invoice.lines as LineItem[]) ?? [];
  const paidLineQty = parsePaidLineQty(invoice.paid_line_qty);
  const delivered = sumDeliveredByItem(
    (notes ?? []).map((n) => ({
      status: String(n.status),
      lines: (n.lines as LineItem[]) ?? [],
    }))
  );

  return buildLineFulfillment(lines, paidLineQty, delivered, enforcePaidQty);
}

export function validatePartialDeliveryLines(
  fulfillment: LineFulfillment[],
  requestedLines: LineItem[]
): LineItem[] {
  const byItem = new Map(fulfillment.map((f) => [f.item_id, f]));
  const result: LineItem[] = [];

  for (const line of requestedLines) {
    if (!line.item_id || line.qty <= 0) continue;
    const f = byItem.get(line.item_id);
    if (!f) throw new Error(`Item ${line.item_name} is not on this invoice`);
    if (line.qty > f.deliverable_qty + 0.0001) {
      throw new Error(
        `${line.item_name}: cannot deliver ${line.qty} — only ${f.deliverable_qty} available (${f.delivered_qty} already delivered)`
      );
    }
    result.push({ ...line, qty: line.qty });
  }

  if (!result.length) throw new Error("Select at least one line with quantity to deliver");
  return result;
}

export async function recordPartialPayment(
  db: Db,
  companyId: string,
  invoiceId: string,
  paidLines: { item_id: string; qty_paid: number }[]
): Promise<Record<string, number>> {
  const { data: invoice, error } = await db
    .from("tax_invoices")
    .select("lines, paid_line_qty, status")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .single();

  if (error || !invoice) throw new Error("Invoice not found");
  if (invoice.status !== "posted") throw new Error("Only posted invoices can record payments");

  const invoiceLines = (invoice.lines as LineItem[]) ?? [];
  const current = parsePaidLineQty(invoice.paid_line_qty);
  const invoicedByItem = new Map(
    invoiceLines.filter((l) => l.item_id).map((l) => [l.item_id, l.qty])
  );

  for (const row of paidLines) {
    if (!row.item_id || row.qty_paid <= 0) continue;
    const max = invoicedByItem.get(row.item_id);
    if (max === undefined) throw new Error(`Item not on invoice: ${row.item_id}`);
    const next = (current[row.item_id] ?? 0) + row.qty_paid;
    if (next > max + 0.0001) {
      throw new Error(`Paid qty cannot exceed invoiced qty for item ${row.item_id}`);
    }
    current[row.item_id] = next;
  }

  const { error: updateError } = await db
    .from("tax_invoices")
    .update({ paid_line_qty: current })
    .eq("id", invoiceId)
    .eq("company_id", companyId);

  if (updateError) throw new Error(updateError.message);
  return current;
}
