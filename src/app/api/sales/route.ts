import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { documentTotal } from "@/lib/sales/calculations";
import {
  assertCompanyAccess,
  getCustomerOrThrow,
  invoiceInsertPayload,
  mapCustomer,
  mapDeliveryNote,
  mapQuotation,
  mapSalesOrder,
  mapTaxInvoice,
  nextDocumentNumber,
  normalizeLines,
  quotationInsertPayload,
  resolveBranchCode,
  salesOrderInsertPayload,
} from "@/lib/server/sales";
import { postDeliveryNoteToInventory } from "@/lib/server/inventory";
import { checkDocumentDelete, deleteDocument } from "@/lib/server/document-delete";
import type { DocumentStatus, LineItem } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { randomUUID } from "crypto";

async function requireSession() {
  const token = await getSessionFromCookies();
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function GET(request: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const resource = searchParams.get("resource") ?? "customers";

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ data: [] });

    if (resource === "customers") {
      const { data, error } = await db
        .from("customers")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapCustomer) });
    }

    if (resource === "quotations") {
      const { data, error } = await db
        .from("quotations")
        .select("*, customers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapQuotation) });
    }

    if (resource === "orders") {
      const { data, error } = await db
        .from("sales_orders")
        .select("*, customers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapSalesOrder) });
    }

    if (resource === "invoices") {
      const { data, error } = await db
        .from("tax_invoices")
        .select("*, customers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapTaxInvoice) });
    }

    if (resource === "delivery_notes") {
      const { data, error } = await db
        .from("delivery_notes")
        .select("*, tax_invoices(number, customers(name))")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapDeliveryNote) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const token = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");
    const companyId = String(body.company_id ?? "");

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (resource === "customers") {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });

      const { data, error } = await db
        .from("customers")
        .insert({
          company_id: companyId,
          name,
          email: String(body.email ?? "").trim() || null,
          phone: String(body.phone ?? "").trim() || null,
          classification: body.classification ?? "retail",
          credit_limit: Number(body.credit_limit ?? 0),
          outstanding_balance: Number(body.outstanding_balance ?? 0),
          is_blocked: Boolean(body.is_blocked),
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapCustomer(data) });
    }

    if (resource === "quotations") {
      const branchId = String(body.branch_id ?? "");
      const customerId = String(body.customer_id ?? "");
      await getCustomerOrThrow(db, companyId, customerId);

      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextDocumentNumber(db, "quotations", companyId, branchCode, "QT");

      const payload = quotationInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        customer_id: customerId,
        number,
        valid_until: body.valid_until ? String(body.valid_until) : undefined,
        lines,
      });

      const { data, error } = await db
        .from("quotations")
        .insert(payload)
        .select("*, customers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapQuotation(data) });
    }

    if (resource === "orders") {
      const branchId = String(body.branch_id ?? "");
      const customerId = String(body.customer_id ?? "");
      await getCustomerOrThrow(db, companyId, customerId);

      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextDocumentNumber(db, "sales_orders", companyId, branchCode, "SO");

      const payload = salesOrderInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        customer_id: customerId,
        number,
        lines,
        salesperson_id: token.sub,
      });

      const { data, error } = await db
        .from("sales_orders")
        .insert(payload)
        .select("*, customers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapSalesOrder(data) });
    }

    if (resource === "invoices") {
      const branchId = String(body.branch_id ?? "");
      const customerId = String(body.customer_id ?? "");
      await getCustomerOrThrow(db, companyId, customerId);

      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextDocumentNumber(db, "tax_invoices", companyId, branchCode, "INV");

      const payload = invoiceInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        customer_id: customerId,
        number,
        lines,
        sales_order_id: body.sales_order_id ? String(body.sales_order_id) : undefined,
      });

      const { data, error } = await db
        .from("tax_invoices")
        .insert(payload)
        .select("*, customers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapTaxInvoice(data) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("access") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");
    const companyId = String(body.company_id ?? "");
    const id = String(body.id ?? "");
    const action = String(body.action ?? "update");

    if (!companyId || !id) {
      return NextResponse.json({ error: "company_id and id required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (resource === "customers") {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.email !== undefined) updates.email = String(body.email).trim() || null;
      if (body.phone !== undefined) updates.phone = String(body.phone).trim() || null;
      if (body.classification !== undefined) updates.classification = body.classification;
      if (body.credit_limit !== undefined) updates.credit_limit = Number(body.credit_limit);
      if (body.is_blocked !== undefined) updates.is_blocked = Boolean(body.is_blocked);

      const { data, error } = await db
        .from("customers")
        .update(updates)
        .eq("id", id)
        .eq("company_id", companyId)
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapCustomer(data) });
    }

    if (resource === "quotations") {
      if (action === "approve") {
        const { data, error } = await db
          .from("quotations")
          .update({ status: "approved" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft quotations can be approved" }, { status: 400 });
        return NextResponse.json({ data: mapQuotation(data) });
      }

      if (action === "reject") {
        const { data, error } = await db
          .from("quotations")
          .update({ status: "rejected" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapQuotation(data) });
      }

      if (action === "convert_to_order") {
        const { data: quotation, error: fetchError } = await db
          .from("quotations")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !quotation) {
          return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
        }
        if (quotation.status !== "approved") {
          return NextResponse.json({ error: "Only approved quotations can be converted" }, { status: 400 });
        }

        await getCustomerOrThrow(db, companyId, quotation.customer_id);
        const branchCode = await resolveBranchCode(db, quotation.branch_id);
        const number = await nextDocumentNumber(db, "sales_orders", companyId, branchCode, "SO");
        const lines = (quotation.lines as LineItem[]) ?? [];

        const payload = salesOrderInsertPayload({
          company_id: companyId,
          branch_id: quotation.branch_id,
          customer_id: quotation.customer_id,
          number,
          lines,
          salesperson_id: token.sub,
          status: "approved",
        });

        const { data, error } = await db
          .from("sales_orders")
          .insert(payload)
          .select("*, customers(name)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapSalesOrder(data) });
      }

      if (action === "update" && body.lines) {
        const lines = normalizeLines(body.lines as LineItem[]);
        const { data, error } = await db
          .from("quotations")
          .update({ lines, total: documentTotal(lines) })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft quotations can be edited" }, { status: 400 });
        return NextResponse.json({ data: mapQuotation(data) });
      }
    }

    if (resource === "orders") {
      if (action === "approve") {
        const { data, error } = await db
          .from("sales_orders")
          .update({ status: "approved" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .in("status", ["draft", "pending_approval"])
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Order cannot be approved" }, { status: 400 });
        return NextResponse.json({ data: mapSalesOrder(data) });
      }

      if (action === "submit") {
        const { data, error } = await db
          .from("sales_orders")
          .update({ status: "pending_approval" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft orders can be submitted" }, { status: 400 });
        return NextResponse.json({ data: mapSalesOrder(data) });
      }

      if (action === "convert_to_invoice") {
        const { data: order, error: fetchError } = await db
          .from("sales_orders")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !order) {
          return NextResponse.json({ error: "Sales order not found" }, { status: 404 });
        }
        if (order.status !== "approved") {
          return NextResponse.json({ error: "Only approved orders can be invoiced" }, { status: 400 });
        }

        await getCustomerOrThrow(db, companyId, order.customer_id);
        const branchCode = await resolveBranchCode(db, order.branch_id);
        const number = await nextDocumentNumber(db, "tax_invoices", companyId, branchCode, "INV");
        const lines = (order.lines as LineItem[]) ?? [];

        const payload = invoiceInsertPayload({
          company_id: companyId,
          branch_id: order.branch_id,
          customer_id: order.customer_id,
          number,
          lines,
          sales_order_id: order.id,
        });

        const { data, error } = await db
          .from("tax_invoices")
          .insert(payload)
          .select("*, customers(name)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapTaxInvoice(data) });
      }
    }

    if (resource === "invoices") {
      if (action === "post") {
        const { data: invoice, error: fetchError } = await db
          .from("tax_invoices")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !invoice) {
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const { data, error } = await db
          .from("tax_invoices")
          .update({ status: "posted" satisfies DocumentStatus, e_invoice_status: "submitted" })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, customers(name)")
          .single();

        if (error) return NextResponse.json({ error: "Only draft invoices can be posted" }, { status: 400 });

        const { data: customer } = await db
          .from("customers")
          .select("outstanding_balance, credit_limit")
          .eq("id", invoice.customer_id)
          .single();

        const newBalance =
          Number(customer?.outstanding_balance ?? 0) + Number(invoice.total);
        const creditLimit = Number(customer?.credit_limit ?? 0);
        const shouldBlock = creditLimit > 0 && newBalance > creditLimit;

        await db
          .from("customers")
          .update({
            outstanding_balance: newBalance,
            is_blocked: shouldBlock,
          })
          .eq("id", invoice.customer_id);

        return NextResponse.json({ data: mapTaxInvoice(data) });
      }

      if (action === "mark_paid") {
        const { data, error } = await db
          .from("tax_invoices")
          .update({ is_paid: true })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "posted")
          .select("*, customers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only posted invoices can be marked paid" }, { status: 400 });
        return NextResponse.json({ data: mapTaxInvoice(data) });
      }

      if (action === "create_delivery_note") {
        const { data: invoice, error: fetchError } = await db
          .from("tax_invoices")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !invoice) {
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        if (invoice.status !== "posted") {
          return NextResponse.json({ error: "Only posted invoices can have delivery notes" }, { status: 400 });
        }

        const branchCode = await resolveBranchCode(db, invoice.branch_id);
        const number = await nextDocumentNumber(db, "delivery_notes", companyId, branchCode, "DN");
        const lines = (invoice.lines as LineItem[]) ?? [];
        const warehouseId = body.warehouse_id ? String(body.warehouse_id) : null;

        const { data, error } = await db
          .from("delivery_notes")
          .insert({
            id: randomUUID(),
            company_id: companyId,
            branch_id: invoice.branch_id,
            invoice_id: invoice.id,
            warehouse_id: warehouseId,
            number,
            date: new Date().toISOString().slice(0, 10),
            status: "draft" satisfies DocumentStatus,
            lines: warehouseId
              ? lines.map((l) => ({ ...l, warehouse_id: l.warehouse_id ?? warehouseId }))
              : lines,
          })
          .select("*, tax_invoices(number, customers(name))")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapDeliveryNote(data) });
      }
    }

    if (resource === "delivery_notes") {
      if (action === "post") {
        const { data: note, error: fetchError } = await db
          .from("delivery_notes")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !note) {
          return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
        }
        if (note.status !== "draft") {
          return NextResponse.json({ error: "Only draft delivery notes can be posted" }, { status: 400 });
        }

        try {
          await postDeliveryNoteToInventory(db, companyId, {
            id: note.id,
            number: note.number,
            warehouse_id: note.warehouse_id,
            lines: (note.lines as LineItem[]) ?? [],
          });
        } catch (stockErr) {
          const message = stockErr instanceof Error ? stockErr.message : "Stock update failed";
          return NextResponse.json({ error: message }, { status: 400 });
        }

        const { data, error } = await db
          .from("delivery_notes")
          .update({ status: "posted" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .select("*, tax_invoices(number, customers(name))")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapDeliveryNote(data) });
      }
    }

    const deletableResources = new Set([
      "quotations",
      "orders",
      "invoices",
      "delivery_notes",
    ]);

    if (deletableResources.has(resource) && action === "check_delete") {
      const data = await checkDocumentDelete(token.role_id, "sales", resource, companyId, id);
      return NextResponse.json({ data });
    }

    if (deletableResources.has(resource) && action === "delete") {
      await deleteDocument(token.role_id, "sales", resource, companyId, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action or resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("access") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
