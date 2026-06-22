import { randomUUID } from "crypto";
import { documentTotal, documentTotals } from "@/lib/sales/calculations";
import {
  assertCompanyAccess,
  normalizeLines,
  resolveBranchCode,
} from "@/lib/server/sales";
import type {
  DocumentStatus,
  LineItem,
  MaterialReceiptNote,
  MaterialRequest,
  PriceUpdateLine,
  ProformaInvoice,
  PurchaseOrder,
  PurchasePayment,
  PurchasePaymentTerms,
  PurchasePaymentType,
  Supplier,
  SupplierDeliveryNote,
  SupplierInvoice,
} from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export { assertCompanyAccess, normalizeLines, resolveBranchCode };

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

type NumberedTable =
  | "material_requests"
  | "purchase_orders"
  | "proforma_invoices"
  | "supplier_delivery_notes"
  | "material_receipt_notes"
  | "supplier_invoices"
  | "purchase_payments";

export async function nextProcurementNumber(
  db: Db,
  table: NumberedTable,
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

export async function getSupplierOrThrow(db: Db, companyId: string, supplierId: string) {
  const { data, error } = await db
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .eq("company_id", companyId)
    .single();

  if (error || !data) throw new Error("Supplier not found");
  if (data.is_blocked) throw new Error("Supplier is blocked — cannot create purchase documents");

  return data;
}

function supplierName(row: Record<string, unknown>): string {
  return String((row.suppliers as { name?: string } | null)?.name ?? "");
}

export function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    name: String(row.name),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    payment_terms: String(row.payment_terms ?? "Net 30"),
    classification: String(row.classification ?? "local"),
    currency: String(row.currency ?? "AED"),
    credit_days: Number(row.credit_days ?? 30),
    is_blocked: Boolean(row.is_blocked),
  };
}

export function mapMaterialRequest(row: Record<string, unknown>): MaterialRequest {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    number: String(row.number),
    date: String(row.date),
    requested_by: String(row.requested_by ?? ""),
    requester_name: (row.profiles as { full_name?: string } | null)?.full_name,
    warehouse_id: row.warehouse_id ? String(row.warehouse_id) : undefined,
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    total: Number(row.total),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    supplier_id: String(row.supplier_id),
    supplier_name: supplierName(row),
    material_request_id: row.material_request_id ? String(row.material_request_id) : undefined,
    number: String(row.number),
    date: String(row.date),
    currency: String(row.currency ?? "AED"),
    payment_terms_type: row.payment_terms_type as PurchasePaymentTerms,
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    total: Number(row.total),
    expected_delivery: row.expected_delivery ? String(row.expected_delivery) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapProformaInvoice(row: Record<string, unknown>): ProformaInvoice {
  const po = row.purchase_orders as { number?: string } | null;
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    purchase_order_id: String(row.purchase_order_id),
    purchase_order_number: po?.number,
    supplier_id: String(row.supplier_id),
    supplier_name: supplierName(row),
    number: String(row.number),
    date: String(row.date),
    supplier_reference: row.supplier_reference ? String(row.supplier_reference) : undefined,
    currency: String(row.currency ?? "AED"),
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    total: Number(row.total),
  };
}

export function mapSupplierDeliveryNote(row: Record<string, unknown>): SupplierDeliveryNote {
  const po = row.purchase_orders as { number?: string } | null;
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    purchase_order_id: String(row.purchase_order_id),
    purchase_order_number: po?.number,
    supplier_id: String(row.supplier_id),
    supplier_name: supplierName(row),
    number: String(row.number),
    date: String(row.date),
    status: row.status as DocumentStatus,
    carrier: row.carrier ? String(row.carrier) : undefined,
    lines: (row.lines as LineItem[]) ?? [],
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapMaterialReceiptNote(row: Record<string, unknown>): MaterialReceiptNote {
  const po = row.purchase_orders as { number?: string } | null;
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    purchase_order_id: String(row.purchase_order_id),
    purchase_order_number: po?.number,
    delivery_note_id: row.delivery_note_id ? String(row.delivery_note_id) : undefined,
    warehouse_id: row.warehouse_id ? String(row.warehouse_id) : undefined,
    number: String(row.number),
    date: String(row.date),
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    price_updates: (row.price_updates as PriceUpdateLine[]) ?? [],
    total: Number(row.total),
  };
}

export function mapSupplierInvoice(row: Record<string, unknown>): SupplierInvoice {
  const po = row.purchase_orders as { number?: string } | null;
  const mrn = row.material_receipt_notes as { number?: string } | null;
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    branch_id: String(row.branch_id),
    supplier_id: String(row.supplier_id),
    supplier_name: supplierName(row),
    purchase_order_id: row.purchase_order_id ? String(row.purchase_order_id) : undefined,
    purchase_order_number: po?.number,
    mrn_id: row.mrn_id ? String(row.mrn_id) : undefined,
    mrn_number: mrn?.number,
    gr_id: row.mrn_id ? String(row.mrn_id) : undefined,
    number: String(row.number),
    date: String(row.date),
    status: row.status as DocumentStatus,
    lines: (row.lines as LineItem[]) ?? [],
    subtotal: Number(row.subtotal),
    vat_amount: Number(row.vat_amount),
    total: Number(row.total),
    is_paid: Boolean(row.is_paid),
  };
}

export function mapPurchasePayment(row: Record<string, unknown>): PurchasePayment {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    supplier_id: String(row.supplier_id),
    supplier_name: supplierName(row),
    purchase_order_id: row.purchase_order_id ? String(row.purchase_order_id) : undefined,
    supplier_invoice_id: row.supplier_invoice_id
      ? String(row.supplier_invoice_id)
      : undefined,
    number: String(row.number),
    date: String(row.date),
    payment_type: row.payment_type as PurchasePaymentType,
    status: row.status as DocumentStatus,
    amount: Number(row.amount),
    currency: String(row.currency ?? "AED"),
    reference: row.reference ? String(row.reference) : undefined,
  };
}

export function materialRequestInsertPayload(input: {
  company_id: string;
  branch_id: string;
  number: string;
  lines: LineItem[];
  requested_by?: string;
  warehouse_id?: string;
  notes?: string;
}) {
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    status: "draft" as DocumentStatus,
    requested_by: input.requested_by ?? null,
    warehouse_id: input.warehouse_id ?? null,
    lines: input.lines,
    total: documentTotal(input.lines),
    notes: input.notes ?? null,
  };
}

export function purchaseOrderInsertPayload(input: {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  number: string;
  lines: LineItem[];
  material_request_id?: string;
  payment_terms_type?: PurchasePaymentTerms;
  currency?: string;
  expected_delivery?: string;
  notes?: string;
  status?: DocumentStatus;
}) {
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    supplier_id: input.supplier_id,
    material_request_id: input.material_request_id ?? null,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    currency: input.currency ?? "AED",
    payment_terms_type: input.payment_terms_type ?? "credit",
    status: input.status ?? ("draft" as DocumentStatus),
    lines: input.lines,
    total: documentTotal(input.lines),
    expected_delivery: input.expected_delivery ?? null,
    notes: input.notes ?? null,
  };
}

export function supplierInvoiceInsertPayload(input: {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  number: string;
  lines: LineItem[];
  purchase_order_id?: string;
  mrn_id?: string;
}) {
  const totals = documentTotals(input.lines);
  return {
    id: randomUUID(),
    company_id: input.company_id,
    branch_id: input.branch_id,
    supplier_id: input.supplier_id,
    purchase_order_id: input.purchase_order_id ?? null,
    mrn_id: input.mrn_id ?? null,
    number: input.number,
    date: new Date().toISOString().slice(0, 10),
    status: "draft" as DocumentStatus,
    lines: input.lines,
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
    is_paid: false,
  };
}
