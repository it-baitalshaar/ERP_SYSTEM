import type {
  Customer,
  DeliveryNote,
  LineItem,
  Quotation,
  SalesOrder,
  TaxInvoice,
} from "@/lib/types";
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
  resource: string
): Promise<{ data: T[]; fromApi: boolean }> {
  const res = await fetch(`/api/sales?companyId=${companyId}&resource=${resource}`);
  if (!res.ok) return { data: [], fromApi: false };
  const json = (await res.json()) as { data?: T[] };
  return { data: json.data ?? [], fromApi: true };
}

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const { data, fromApi } = await fetchSalesResource<Customer>(companyId, "customers");
  if (fromApi) return data;
  return mockCustomers.filter((c) => c.company_id === companyId);
}

export async function fetchQuotations(companyId: string): Promise<Quotation[]> {
  const { data, fromApi } = await fetchSalesResource<Quotation>(companyId, "quotations");
  if (fromApi) return data;
  return mockQuotations.filter((q) => q.company_id === companyId);
}

export async function fetchSalesOrders(companyId: string): Promise<SalesOrder[]> {
  const { data, fromApi } = await fetchSalesResource<SalesOrder>(companyId, "orders");
  if (fromApi) return data;
  return mockOrders.filter((o) => o.company_id === companyId);
}

export async function fetchDeliveryNotes(companyId: string): Promise<DeliveryNote[]> {
  const { data, fromApi } = await fetchSalesResource<DeliveryNote>(companyId, "delivery_notes");
  if (fromApi) return data;
  return [];
}

export async function fetchTaxInvoices(companyId: string): Promise<TaxInvoice[]> {
  const { data, fromApi } = await fetchSalesResource<TaxInvoice>(companyId, "invoices");
  if (fromApi) return data;
  return mockInvoices.filter((i) => i.company_id === companyId);
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
