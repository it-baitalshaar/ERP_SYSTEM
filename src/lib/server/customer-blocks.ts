import { randomUUID } from "crypto";
import type { CustomerProductBlock } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

export async function expireCustomerBlocks(db: Db, companyId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .from("customer_product_blocks")
    .update({ status: "expired" })
    .eq("company_id", companyId)
    .eq("status", "active")
    .lt("blocked_until", now);
}

export function mapCustomerProductBlock(row: Record<string, unknown>): CustomerProductBlock {
  const customer = row.customers as { name?: string; phone?: string } | null;
  const item = row.items as { name?: string; sku?: string } | null;
  const invoice = row.tax_invoices as { number?: string } | null;

  return {
    id: String(row.id),
    company_id: String(row.company_id),
    customer_id: String(row.customer_id),
    customer_name: customer?.name ? String(customer.name) : undefined,
    customer_phone: customer?.phone ? String(customer.phone) : undefined,
    item_id: String(row.item_id),
    item_name: item?.name ? String(item.name) : undefined,
    item_sku: item?.sku ? String(item.sku) : undefined,
    warehouse_id: row.warehouse_id ? String(row.warehouse_id) : undefined,
    qty: Number(row.qty),
    blocked_until: String(row.blocked_until),
    status: row.status as CustomerProductBlock["status"],
    reason: row.reason ? String(row.reason) : undefined,
    invoice_id: row.invoice_id ? String(row.invoice_id) : undefined,
    invoice_number: invoice?.number ? String(invoice.number) : undefined,
    whatsapp_reminder: row.whatsapp_reminder !== false,
    reminder_sent_at: row.reminder_sent_at ? String(row.reminder_sent_at) : undefined,
    created_at: String(row.created_at),
    released_at: row.released_at ? String(row.released_at) : undefined,
  };
}

const BLOCK_SELECT =
  "*, customers(name, phone), items(name, sku), tax_invoices(number)";

export async function listCustomerProductBlocks(
  db: Db,
  companyId: string,
  filters?: { customerId?: string; itemId?: string; activeOnly?: boolean }
): Promise<CustomerProductBlock[]> {
  await expireCustomerBlocks(db, companyId);

  let query = db
    .from("customer_product_blocks")
    .select(BLOCK_SELECT)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters?.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters?.itemId) query = query.eq("item_id", filters.itemId);
  if (filters?.activeOnly) query = query.eq("status", "active");

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapCustomerProductBlock(row as Record<string, unknown>)
  );
}

export async function createCustomerProductBlock(
  db: Db,
  input: {
    company_id: string;
    customer_id: string;
    item_id: string;
    qty: number;
    blocked_until: string;
    reason?: string;
    invoice_id?: string;
    sales_order_id?: string;
    warehouse_id?: string;
    whatsapp_reminder?: boolean;
    created_by?: string;
  }
): Promise<CustomerProductBlock> {
  const { data, error } = await db
    .from("customer_product_blocks")
    .insert({
      id: randomUUID(),
      company_id: input.company_id,
      customer_id: input.customer_id,
      item_id: input.item_id,
      qty: input.qty,
      blocked_until: input.blocked_until,
      reason: input.reason ?? null,
      invoice_id: input.invoice_id ?? null,
      sales_order_id: input.sales_order_id ?? null,
      warehouse_id: input.warehouse_id ?? null,
      whatsapp_reminder: input.whatsapp_reminder ?? true,
      created_by: input.created_by ?? null,
      status: "active",
    })
    .select(BLOCK_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapCustomerProductBlock(data as Record<string, unknown>);
}

export async function releaseCustomerProductBlock(
  db: Db,
  companyId: string,
  blockId: string
): Promise<CustomerProductBlock> {
  const { data, error } = await db
    .from("customer_product_blocks")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", blockId)
    .eq("company_id", companyId)
    .eq("status", "active")
    .select(BLOCK_SELECT)
    .single();

  if (error || !data) throw new Error("Block not found or already released");
  return mapCustomerProductBlock(data as Record<string, unknown>);
}

export async function markBlockReminderSent(
  db: Db,
  companyId: string,
  blockId: string
): Promise<void> {
  await db
    .from("customer_product_blocks")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", blockId)
    .eq("company_id", companyId);
}

export async function getActiveBlocksForItem(
  db: Db,
  companyId: string,
  itemId: string
): Promise<CustomerProductBlock[]> {
  return listCustomerProductBlocks(db, companyId, { itemId, activeOnly: true });
}

export async function assertCustomerNotBlockedFromItem(
  db: Db,
  companyId: string,
  customerId: string,
  itemId: string
): Promise<void> {
  const blocks = await listCustomerProductBlocks(db, companyId, {
    itemId,
    activeOnly: true,
  });
  const otherBlock = blocks.find((b) => b.customer_id !== customerId);
  if (otherBlock) {
    throw new Error(
      `${otherBlock.item_name ?? "Product"} is reserved for ${otherBlock.customer_name ?? "another customer"} until ${new Date(otherBlock.blocked_until).toLocaleDateString()}`
    );
  }
}
