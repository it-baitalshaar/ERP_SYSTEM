import { randomUUID } from "crypto";
import { documentTotal, documentTotals } from "@/lib/sales/calculations";
import type {
  Customer,
  DocumentStatus,
  LineItem,
  Quotation,
  SalesOrder,
  TaxInvoice,
} from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export async function assertCompanyAccess(userId: string, companyId: string) {
  const db = createAdminClientOrNull();
  if (!db) return;

  const { data } = await db
    .from("user_companies")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!data) throw new Error("You do not have access to this company");
}

export async function getCustomerOrThrow(db: Db, companyId: string, customerId: string) {
  const { data, error } = await db
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .single();

  if (error || !data) throw new Error("Customer not found");
  if (data.is_blocked) throw new Error("Customer is blocked — cannot create sales documents");

  return data;
}

export async function nextDocumentNumber(
  db: Db,
  table: "quotations" | "sales_orders" | "tax_invoices",
  companyId: string,
  branchCode: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${branchCode.toUpperCase()}-${year}-`;

  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .like("number", `${pattern}%`);

  if (error) throw new Error(error.message);

  const seq = String((count ?? 0) + 1).padStart(5, "0");
  return `${pattern}${seq}`;
}

export async function resolveBranchCode(db: Db, branchId: string): Promise<string> {
  const { data, error } = await db.from("branches").select("code").eq("id", branchId).single();
  if (error || !data?.code) throw new Error("Branch not found");
  return data.code;
}

export function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    name: String(row.name),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    classification: row.classification as Customer["classification"],
    credit_limit: Number(row.credit_limit),
    outstanding_balance: Number(row.outstanding_balance),
    is_blocked: Boolean(row.is_blocked),
  };
}

export function mapQuotation(row: Record<string, unknown>): Quotation {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    customer_id: String(row.customer_id),
    customer_name: String((row.customers as { name?: string } | null)?.name ?? ""),
    number: String(row.number),
    date: String(row.date),
    valid_until: row.valid_until ? String(row.valid_until) : "",
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    total: Number(row.total),
  };
}

export function mapSalesOrder(row: Record<string, unknown>): SalesOrder {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    customer_id: String(row.customer_id),
    customer_name: String((row.customers as { name?: string } | null)?.name ?? ""),
    number: String(row.number),
    date: String(row.date),
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    total: Number(row.total),
    salesperson_id: String(row.salesperson_id ?? ""),
  };
}

export function mapTaxInvoice(row: Record<string, unknown>): TaxInvoice {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    customer_id: String(row.customer_id),
    customer_name: String((row.customers as { name?: string } | null)?.name ?? ""),
    sales_order_id: row.sales_order_id ? String(row.sales_order_id) : undefined,
    number: String(row.number),
    date: String(row.date),
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    subtotal: Number(row.subtotal),
    vat_amount: Number(row.vat_amount),
    total: Number(row.total),
    is_paid: Boolean(row.is_paid),
    e_invoice_status: row.e_invoice_status as TaxInvoice["e_invoice_status"],
  };
}

export function normalizeLines(lines: LineItem[]): LineItem[] {
  if (!lines.length) throw new Error("At least one line item is required");

  return lines.map((line) => {
    if (!line.item_name?.trim()) throw new Error("Each line needs an item name");
    if (line.qty <= 0) throw new Error("Quantity must be greater than zero");
    if (line.unit_price < 0) throw new Error("Unit price cannot be negative");

    return {
      item_id: line.item_id || randomUUID(),
      item_name: line.item_name.trim(),
      qty: Number(line.qty),
      uom: line.uom || "pcs",
      unit_price: Number(line.unit_price),
      discount_pct: Number(line.discount_pct ?? 0),
      vat_pct: Number(line.vat_pct ?? 5),
      warehouse_id: line.warehouse_id,
    };
  });
}

export function quotationInsertPayload(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  number: string;
  valid_until?: string;
  lines: LineItem[];
}) {
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    customer_id: input.customer_id,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    valid_until: input.valid_until || null,
    status: "draft" as DocumentStatus,
    lines: input.lines,
    total: documentTotal(input.lines),
  };
}

export function salesOrderInsertPayload(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  number: string;
  lines: LineItem[];
  salesperson_id?: string;
  status?: DocumentStatus;
}) {
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    customer_id: input.customer_id,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    status: input.status ?? ("draft" as DocumentStatus),
    lines: input.lines,
    total: documentTotal(input.lines),
    salesperson_id: input.salesperson_id ?? null,
  };
}

export function invoiceInsertPayload(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  number: string;
  lines: LineItem[];
  sales_order_id?: string;
  status?: DocumentStatus;
}) {
  const totals = documentTotals(input.lines);
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    customer_id: input.customer_id,
    sales_order_id: input.sales_order_id ?? null,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    status: input.status ?? ("draft" as DocumentStatus),
    lines: input.lines,
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
    is_paid: false,
    e_invoice_status: "pending",
  };
}
