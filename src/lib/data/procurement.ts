import type {
  LineItem,
  MaterialReceiptNote,
  MaterialRequest,
  ProformaInvoice,
  PurchaseOrder,
  PurchasePayment,
  PurchasePaymentTerms,
  PurchasePaymentType,
  Supplier,
  SupplierDeliveryNote,
  SupplierInvoice,
} from "@/lib/types";
import type { ThreeWayMatchResult } from "@/lib/procurement/three-way-match";

async function procurementRequest<T>(
  url: string,
  init?: RequestInit
): Promise<{ data?: T; error?: string }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json.data };
}

async function fetchProcurementResource<T>(
  companyId: string,
  resource: string,
  branchId?: string
): Promise<T[]> {
  const params = new URLSearchParams({ companyId, resource });
  if (branchId) params.set("branchId", branchId);
  const res = await fetch(`/api/procurement?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: T[] };
  return json.data ?? [];
}

export async function fetchSuppliers(companyId: string): Promise<Supplier[]> {
  return fetchProcurementResource<Supplier>(companyId, "suppliers");
}

export async function fetchMaterialRequests(
  companyId: string,
  branchId?: string
): Promise<MaterialRequest[]> {
  return fetchProcurementResource<MaterialRequest>(
    companyId,
    "material_requests",
    branchId
  );
}

export async function fetchPurchaseOrders(
  companyId: string,
  branchId?: string
): Promise<PurchaseOrder[]> {
  return fetchProcurementResource<PurchaseOrder>(
    companyId,
    "purchase_orders",
    branchId
  );
}

export async function fetchProformaInvoices(
  companyId: string,
  branchId?: string
): Promise<ProformaInvoice[]> {
  return fetchProcurementResource<ProformaInvoice>(
    companyId,
    "proforma_invoices",
    branchId
  );
}

export async function fetchSupplierDeliveryNotes(
  companyId: string,
  branchId?: string
): Promise<SupplierDeliveryNote[]> {
  return fetchProcurementResource<SupplierDeliveryNote>(
    companyId,
    "supplier_delivery_notes",
    branchId
  );
}

export async function fetchMaterialReceiptNotes(
  companyId: string,
  branchId?: string
): Promise<MaterialReceiptNote[]> {
  return fetchProcurementResource<MaterialReceiptNote>(
    companyId,
    "material_receipt_notes",
    branchId
  );
}

export async function fetchSupplierInvoices(
  companyId: string,
  branchId?: string
): Promise<SupplierInvoice[]> {
  return fetchProcurementResource<SupplierInvoice>(
    companyId,
    "supplier_invoices",
    branchId
  );
}

export async function fetchPurchasePayments(
  companyId: string,
  branchId?: string
): Promise<PurchasePayment[]> {
  return fetchProcurementResource<PurchasePayment>(
    companyId,
    "purchase_payments",
    branchId
  );
}

export async function createSupplier(
  companyId: string,
  input: Omit<Supplier, "id" | "company_id">
): Promise<{ data?: Supplier; error?: string }> {
  return procurementRequest<Supplier>("/api/procurement", {
    method: "POST",
    body: JSON.stringify({ resource: "suppliers", company_id: companyId, ...input }),
  });
}

export async function updateSupplier(
  companyId: string,
  id: string,
  input: Partial<Supplier>
): Promise<{ data?: Supplier; error?: string }> {
  return procurementRequest<Supplier>("/api/procurement", {
    method: "PATCH",
    body: JSON.stringify({ resource: "suppliers", company_id: companyId, id, ...input }),
  });
}

export async function createMaterialRequest(input: {
  company_id: string;
  branch_id: string;
  lines: LineItem[];
  warehouse_id?: string;
  notes?: string;
}): Promise<{ data?: MaterialRequest; error?: string }> {
  return procurementRequest<MaterialRequest>("/api/procurement", {
    method: "POST",
    body: JSON.stringify({ resource: "material_requests", ...input }),
  });
}

export async function createPurchaseOrder(input: {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  lines: LineItem[];
  material_request_id?: string;
  payment_terms_type?: PurchasePaymentTerms;
  currency?: string;
  expected_delivery?: string;
  notes?: string;
}): Promise<{ data?: PurchaseOrder; error?: string }> {
  return procurementRequest<PurchaseOrder>("/api/procurement", {
    method: "POST",
    body: JSON.stringify({ resource: "purchase_orders", ...input }),
  });
}

export async function createSupplierInvoice(input: {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  lines: LineItem[];
  purchase_order_id?: string;
  mrn_id?: string;
}): Promise<{ data?: SupplierInvoice; error?: string }> {
  return procurementRequest<SupplierInvoice>("/api/procurement", {
    method: "POST",
    body: JSON.stringify({ resource: "supplier_invoices", ...input }),
  });
}

export async function createPurchasePayment(input: {
  company_id: string;
  branch_id?: string;
  supplier_id: string;
  amount: number;
  payment_type?: PurchasePaymentType;
  purchase_order_id?: string;
  supplier_invoice_id?: string;
  currency?: string;
  reference?: string;
}): Promise<{ data?: PurchasePayment; error?: string }> {
  return procurementRequest<PurchasePayment>("/api/procurement", {
    method: "POST",
    body: JSON.stringify({ resource: "purchase_payments", ...input }),
  });
}

export async function procurementAction<T>(
  resource: string,
  companyId: string,
  id: string,
  action: string,
  extra?: Record<string, unknown>
): Promise<{ data?: T; error?: string }> {
  return procurementRequest<T>("/api/procurement", {
    method: "PATCH",
    body: JSON.stringify({ resource, company_id: companyId, id, action, ...extra }),
  });
}

export async function fetchThreeWayMatch(
  companyId: string,
  params: { mrnId?: string; supplierInvoiceId?: string }
) {
  const q = new URLSearchParams({ companyId, resource: "three_way_match" });
  if (params.mrnId) q.set("mrnId", params.mrnId);
  if (params.supplierInvoiceId) q.set("supplierInvoiceId", params.supplierInvoiceId);
  const res = await fetch(`/api/procurement?${q}`);
  const json = (await res.json()) as { data?: ThreeWayMatchResult; error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json.data };
}

export async function fetchMrnInvoicePreview(companyId: string, mrnId: string) {
  const q = new URLSearchParams({ companyId, resource: "mrn_invoice_preview", mrnId });
  const res = await fetch(`/api/procurement?${q}`);
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json.data };
}

export async function createSupplierInvoiceFromMrn(
  companyId: string,
  branchId: string,
  mrnId: string
): Promise<{ data?: SupplierInvoice; error?: string }> {
  return procurementRequest<SupplierInvoice>("/api/procurement", {
    method: "PATCH",
    body: JSON.stringify({
      resource: "material_receipt_notes",
      company_id: companyId,
      branch_id: branchId,
      id: mrnId,
      action: "create_supplier_invoice",
    }),
  });
}
