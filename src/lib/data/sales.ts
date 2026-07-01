import type {
  Customer,
  CustomerProductBlock,
  DeliveryNote,
  LineItem,
  Quotation,
  SalesOrder,
  TaxInvoice,
} from "@/lib/types";
import type { LineFulfillment } from "@/lib/sales/delivery-fulfillment";
import type { BelowCostLineWarning } from "@/lib/sales/below-cost";
import {
  customers as mockCustomers,
  quotations as mockQuotations,
  salesOrders as mockOrders,
  taxInvoices as mockInvoices,
} from "@/lib/mock-data/sales";

async function salesRequest<T>(
  url: string,
  init?: RequestInit
): Promise<{ data?: T; error?: string; code?: string; warnings?: BelowCostLineWarning[] }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = (await res.json()) as {
    data?: T;
    error?: string;
    code?: string;
    warnings?: BelowCostLineWarning[];
  };
  if (!res.ok) {
    return {
      error: json.error ?? "Request failed",
      code: json.code,
      warnings: json.warnings,
    };
  }
  return { data: json.data };
}

async function fetchSalesResource<T>(
  companyId: string,
  resource: string,
  branchId?: string
): Promise<{ data: T[]; fromApi: boolean }> {
  const params = new URLSearchParams({ companyId, resource });
  if (branchId) params.set("branchId", branchId);
  const res = await fetch(`/api/sales?${params.toString()}`);
  if (!res.ok) return { data: [], fromApi: false };
  const json = (await res.json()) as { data?: T[] };
  return { data: json.data ?? [], fromApi: true };
}

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const { data, fromApi } = await fetchSalesResource<Customer>(companyId, "customers");
  if (fromApi) return data;
  return mockCustomers.filter((c) => c.company_id === companyId);
}

export async function fetchQuotations(
  companyId: string,
  branchId?: string
): Promise<Quotation[]> {
  const { data, fromApi } = await fetchSalesResource<Quotation>(
    companyId,
    "quotations",
    branchId
  );
  if (fromApi) return data;
  return mockQuotations.filter(
    (q) =>
      q.company_id === companyId && (!branchId || q.branch_id === branchId)
  );
}

export async function fetchSalesOrders(
  companyId: string,
  branchId?: string
): Promise<SalesOrder[]> {
  const { data, fromApi } = await fetchSalesResource<SalesOrder>(
    companyId,
    "orders",
    branchId
  );
  if (fromApi) return data;
  return mockOrders.filter(
    (o) =>
      o.company_id === companyId && (!branchId || o.branch_id === branchId)
  );
}

export async function fetchDeliveryNotes(
  companyId: string,
  branchId?: string
): Promise<DeliveryNote[]> {
  const { data, fromApi } = await fetchSalesResource<DeliveryNote>(
    companyId,
    "delivery_notes",
    branchId
  );
  if (fromApi) return data;
  return [];
}

export async function fetchTaxInvoices(
  companyId: string,
  branchId?: string
): Promise<TaxInvoice[]> {
  const { data, fromApi } = await fetchSalesResource<TaxInvoice>(
    companyId,
    "invoices",
    branchId
  );
  if (fromApi) return data;
  return mockInvoices.filter(
    (i) =>
      i.company_id === companyId && (!branchId || i.branch_id === branchId)
  );
}

export async function createCustomer(
  companyId: string,
  input: Omit<Customer, "id" | "company_id" | "outstanding_balance">
): Promise<{ data?: Customer; error?: string }> {
  return salesRequest<Customer>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ resource: "customers", company_id: companyId, ...input }),
  });
}

export async function updateCustomer(
  companyId: string,
  id: string,
  input: Partial<Customer>
): Promise<{ data?: Customer; error?: string }> {
  return salesRequest<Customer>("/api/sales", {
    method: "PATCH",
    body: JSON.stringify({ resource: "customers", company_id: companyId, id, ...input }),
  });
}

export async function createQuotation(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  valid_until?: string;
  lines: LineItem[];
  acknowledge_below_cost?: boolean;
}): Promise<{
  data?: Quotation;
  error?: string;
  code?: string;
  warnings?: BelowCostLineWarning[];
}> {
  return salesRequest<Quotation>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ resource: "quotations", ...input }),
  });
}

export async function createSalesOrder(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  lines: LineItem[];
  acknowledge_below_cost?: boolean;
}): Promise<{
  data?: SalesOrder;
  error?: string;
  code?: string;
  warnings?: BelowCostLineWarning[];
}> {
  return salesRequest<SalesOrder>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ resource: "orders", ...input }),
  });
}

export async function createTaxInvoice(input: {
  company_id: string;
  branch_id: string;
  customer_id: string;
  lines: LineItem[];
  sales_order_id?: string;
  acknowledge_below_cost?: boolean;
}): Promise<{
  data?: TaxInvoice;
  error?: string;
  code?: string;
  warnings?: BelowCostLineWarning[];
}> {
  return salesRequest<TaxInvoice>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ resource: "invoices", ...input }),
  });
}

export async function salesAction<T>(
  resource: string,
  companyId: string,
  id: string,
  action: string,
  extra?: Record<string, unknown>
): Promise<{ data?: T; error?: string }> {
  return salesRequest<T>("/api/sales", {
    method: "PATCH",
    body: JSON.stringify({ resource, company_id: companyId, id, action, ...extra }),
  });
}

export async function fetchInvoiceFulfillment(
  companyId: string,
  invoiceId: string
): Promise<LineFulfillment[]> {
  const res = await fetch(
    `/api/sales?companyId=${companyId}&resource=invoice_fulfillment&invoiceId=${invoiceId}`
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: LineFulfillment[] };
  return json.data ?? [];
}

export async function fetchCustomerProductBlocks(
  companyId: string,
  filters?: { customerId?: string; itemId?: string; activeOnly?: boolean }
): Promise<CustomerProductBlock[]> {
  const params = new URLSearchParams({ companyId, resource: "customer_product_blocks" });
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.itemId) params.set("itemId", filters.itemId);
  if (filters?.activeOnly) params.set("activeOnly", "true");
  const res = await fetch(`/api/sales?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: CustomerProductBlock[] };
  return json.data ?? [];
}

export async function createCustomerProductBlock(input: {
  company_id: string;
  customer_id: string;
  item_id: string;
  qty: number;
  blocked_until: string;
  reason?: string;
  invoice_id?: string;
  warehouse_id?: string;
  whatsapp_reminder?: boolean;
}): Promise<{ data?: CustomerProductBlock; error?: string }> {
  return salesRequest<CustomerProductBlock>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ resource: "customer_product_blocks", ...input }),
  });
}
