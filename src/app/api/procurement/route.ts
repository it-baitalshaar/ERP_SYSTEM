import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { documentTotal } from "@/lib/sales/calculations";
import {
  assertCompanyAccess,
  getSupplierOrThrow,
  mapMaterialReceiptNote,
  mapMaterialRequest,
  mapProformaInvoice,
  mapPurchaseOrder,
  mapPurchasePayment,
  mapSupplier,
  mapSupplierDeliveryNote,
  mapSupplierInvoice,
  materialRequestInsertPayload,
  nextProcurementNumber,
  normalizeLines,
  purchaseOrderInsertPayload,
  resolveBranchCode,
  supplierInvoiceInsertPayload,
} from "@/lib/server/procurement";
import type {
  DocumentStatus,
  LineItem,
  PriceUpdateLine,
  PurchasePaymentTerms,
  PurchasePaymentType,
} from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { randomUUID } from "crypto";

async function requireSession() {
  const token = await getSessionFromCookies();
  if (!token) throw new Error("Unauthorized");
  return token;
}

const RESOURCE_MAP = {
  suppliers: "suppliers",
  material_requests: "material_requests",
  purchase_orders: "purchase_orders",
  proforma_invoices: "proforma_invoices",
  supplier_delivery_notes: "supplier_delivery_notes",
  material_receipt_notes: "material_receipt_notes",
  supplier_invoices: "supplier_invoices",
  purchase_payments: "purchase_payments",
  // aliases
  requisitions: "material_requests",
  orders: "purchase_orders",
} as const;

function resolveResource(raw: string): string {
  return RESOURCE_MAP[raw as keyof typeof RESOURCE_MAP] ?? raw;
}

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const resource = resolveResource(searchParams.get("resource") ?? "suppliers");

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ data: [] });

    if (resource === "suppliers") {
      const { data, error } = await db
        .from("suppliers")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapSupplier) });
    }

    if (resource === "material_requests") {
      const { data, error } = await db
        .from("material_requests")
        .select("*, profiles(full_name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapMaterialRequest) });
    }

    if (resource === "purchase_orders") {
      const { data, error } = await db
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapPurchaseOrder) });
    }

    if (resource === "proforma_invoices") {
      const { data, error } = await db
        .from("proforma_invoices")
        .select("*, suppliers(name), purchase_orders(number)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapProformaInvoice) });
    }

    if (resource === "supplier_delivery_notes") {
      const { data, error } = await db
        .from("supplier_delivery_notes")
        .select("*, suppliers(name), purchase_orders(number)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapSupplierDeliveryNote) });
    }

    if (resource === "material_receipt_notes") {
      const { data, error } = await db
        .from("material_receipt_notes")
        .select("*, purchase_orders(number)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapMaterialReceiptNote) });
    }

    if (resource === "supplier_invoices") {
      const { data, error } = await db
        .from("supplier_invoices")
        .select("*, suppliers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapSupplierInvoice) });
    }

    if (resource === "purchase_payments") {
      const { data, error } = await db
        .from("purchase_payments")
        .select("*, suppliers(name)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapPurchasePayment) });
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
    const resource = resolveResource(String(body.resource ?? ""));
    const companyId = String(body.company_id ?? "");

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (resource === "suppliers") {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });

      const { data, error } = await db
        .from("suppliers")
        .insert({
          company_id: companyId,
          name,
          email: String(body.email ?? "").trim() || null,
          phone: String(body.phone ?? "").trim() || null,
          payment_terms: String(body.payment_terms ?? "Net 30"),
          classification: body.classification ?? "local",
          currency: String(body.currency ?? "AED"),
          credit_days: Number(body.credit_days ?? 30),
          is_blocked: Boolean(body.is_blocked),
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapSupplier(data) });
    }

    if (resource === "material_requests") {
      const branchId = String(body.branch_id ?? "");
      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextProcurementNumber(db, "material_requests", companyId, branchCode, "MR");

      const payload = materialRequestInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        number,
        lines,
        requested_by: token.sub,
        warehouse_id: body.warehouse_id ? String(body.warehouse_id) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
      });

      const { data, error } = await db
        .from("material_requests")
        .insert(payload)
        .select("*, profiles(full_name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapMaterialRequest(data) });
    }

    if (resource === "purchase_orders") {
      const branchId = String(body.branch_id ?? "");
      const supplierId = String(body.supplier_id ?? "");
      await getSupplierOrThrow(db, companyId, supplierId);

      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextProcurementNumber(db, "purchase_orders", companyId, branchCode, "LPO");

      const payload = purchaseOrderInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        supplier_id: supplierId,
        number,
        lines,
        material_request_id: body.material_request_id ? String(body.material_request_id) : undefined,
        payment_terms_type: body.payment_terms_type as PurchasePaymentTerms | undefined,
        currency: body.currency ? String(body.currency) : undefined,
        expected_delivery: body.expected_delivery ? String(body.expected_delivery) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
      });

      const { data, error } = await db
        .from("purchase_orders")
        .insert(payload)
        .select("*, suppliers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapPurchaseOrder(data) });
    }

    if (resource === "supplier_invoices") {
      const branchId = String(body.branch_id ?? "");
      const supplierId = String(body.supplier_id ?? "");
      await getSupplierOrThrow(db, companyId, supplierId);

      const lines = normalizeLines((body.lines as LineItem[]) ?? []);
      const branchCode = await resolveBranchCode(db, branchId);
      const number = await nextProcurementNumber(db, "supplier_invoices", companyId, branchCode, "SINV");

      const payload = supplierInvoiceInsertPayload({
        company_id: companyId,
        branch_id: branchId,
        supplier_id: supplierId,
        number,
        lines,
        purchase_order_id: body.purchase_order_id ? String(body.purchase_order_id) : undefined,
        mrn_id: body.mrn_id ? String(body.mrn_id) : undefined,
      });

      const { data, error } = await db
        .from("supplier_invoices")
        .insert(payload)
        .select("*, suppliers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapSupplierInvoice(data) });
    }

    if (resource === "purchase_payments") {
      const supplierId = String(body.supplier_id ?? "");
      await getSupplierOrThrow(db, companyId, supplierId);

      const amount = Number(body.amount ?? 0);
      if (amount <= 0) return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });

      const branchId = body.branch_id ? String(body.branch_id) : null;
      let branchCode = "HQ";
      if (branchId) {
        branchCode = await resolveBranchCode(db, branchId);
      } else {
        const { data: branch } = await db
          .from("branches")
          .select("code")
          .eq("company_id", companyId)
          .limit(1)
          .maybeSingle();
        if (branch?.code) branchCode = branch.code;
      }

      const number = await nextProcurementNumber(db, "purchase_payments", companyId, branchCode, "PAY");

      const { data, error } = await db
        .from("purchase_payments")
        .insert({
          id: randomUUID(),
          company_id: companyId,
          supplier_id: supplierId,
          purchase_order_id: body.purchase_order_id ? String(body.purchase_order_id) : null,
          supplier_invoice_id: body.supplier_invoice_id ? String(body.supplier_invoice_id) : null,
          number,
          date: new Date().toISOString().slice(0, 10),
          payment_type: (body.payment_type as PurchasePaymentType) ?? "final",
          status: "draft" satisfies DocumentStatus,
          amount,
          currency: String(body.currency ?? "AED"),
          reference: body.reference ? String(body.reference) : null,
        })
        .select("*, suppliers(name)")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapPurchasePayment(data) });
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
    const resource = resolveResource(String(body.resource ?? ""));
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

    if (resource === "suppliers") {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.email !== undefined) updates.email = String(body.email).trim() || null;
      if (body.phone !== undefined) updates.phone = String(body.phone).trim() || null;
      if (body.payment_terms !== undefined) updates.payment_terms = String(body.payment_terms);
      if (body.classification !== undefined) updates.classification = body.classification;
      if (body.currency !== undefined) updates.currency = String(body.currency);
      if (body.credit_days !== undefined) updates.credit_days = Number(body.credit_days);
      if (body.is_blocked !== undefined) updates.is_blocked = Boolean(body.is_blocked);

      const { data, error } = await db
        .from("suppliers")
        .update(updates)
        .eq("id", id)
        .eq("company_id", companyId)
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapSupplier(data) });
    }

    if (resource === "material_requests") {
      if (action === "submit") {
        const { data, error } = await db
          .from("material_requests")
          .update({ status: "pending_approval" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, profiles(full_name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft requests can be submitted" }, { status: 400 });
        return NextResponse.json({ data: mapMaterialRequest(data) });
      }

      if (action === "approve") {
        const { data, error } = await db
          .from("material_requests")
          .update({
            status: "approved" satisfies DocumentStatus,
            approved_by: token.sub,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("company_id", companyId)
          .in("status", ["draft", "pending_approval"])
          .select("*, profiles(full_name)")
          .single();
        if (error) return NextResponse.json({ error: "Request cannot be approved" }, { status: 400 });
        return NextResponse.json({ data: mapMaterialRequest(data) });
      }

      if (action === "reject") {
        const { data, error } = await db
          .from("material_requests")
          .update({ status: "rejected" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .select("*, profiles(full_name)")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapMaterialRequest(data) });
      }

      if (action === "convert_to_lpo") {
        const { data: mr, error: fetchError } = await db
          .from("material_requests")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !mr) {
          return NextResponse.json({ error: "Material request not found" }, { status: 404 });
        }
        if (mr.status !== "approved") {
          return NextResponse.json({ error: "Only approved requests can become LPO" }, { status: 400 });
        }

        const supplierId = String(body.supplier_id ?? "");
        if (!supplierId) {
          return NextResponse.json({ error: "supplier_id required for LPO" }, { status: 400 });
        }
        await getSupplierOrThrow(db, companyId, supplierId);

        const branchCode = await resolveBranchCode(db, mr.branch_id);
        const number = await nextProcurementNumber(db, "purchase_orders", companyId, branchCode, "LPO");
        const lines = (mr.lines as LineItem[]) ?? [];

        const payload = purchaseOrderInsertPayload({
          company_id: companyId,
          branch_id: mr.branch_id,
          supplier_id: supplierId,
          material_request_id: mr.id,
          number,
          lines,
          payment_terms_type: body.payment_terms_type as PurchasePaymentTerms | undefined,
          status: "draft",
        });

        const { data, error } = await db
          .from("purchase_orders")
          .insert(payload)
          .select("*, suppliers(name)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapPurchaseOrder(data) });
      }
    }

    if (resource === "purchase_orders") {
      if (action === "submit") {
        const { data, error } = await db
          .from("purchase_orders")
          .update({ status: "pending_approval" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, suppliers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft LPOs can be submitted" }, { status: 400 });
        return NextResponse.json({ data: mapPurchaseOrder(data) });
      }

      if (action === "approve") {
        const { data, error } = await db
          .from("purchase_orders")
          .update({ status: "approved" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .in("status", ["draft", "pending_approval"])
          .select("*, suppliers(name)")
          .single();
        if (error) return NextResponse.json({ error: "LPO cannot be approved" }, { status: 400 });
        return NextResponse.json({ data: mapPurchaseOrder(data) });
      }

      if (action === "create_proforma") {
        const { data: po, error: fetchError } = await db
          .from("purchase_orders")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !po) {
          return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }
        if (po.status !== "approved") {
          return NextResponse.json({ error: "Only approved LPOs can have proforma" }, { status: 400 });
        }

        const branchCode = await resolveBranchCode(db, po.branch_id);
        const number = await nextProcurementNumber(db, "proforma_invoices", companyId, branchCode, "PFI");
        const lines = (po.lines as LineItem[]) ?? [];

        const { data, error } = await db
          .from("proforma_invoices")
          .insert({
            id: randomUUID(),
            company_id: companyId,
            purchase_order_id: po.id,
            supplier_id: po.supplier_id,
            number,
            date: new Date().toISOString().slice(0, 10),
            status: "draft" satisfies DocumentStatus,
            supplier_reference: body.supplier_reference ? String(body.supplier_reference) : null,
            currency: po.currency,
            lines,
            total: documentTotal(lines),
          })
          .select("*, suppliers(name), purchase_orders(number)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapProformaInvoice(data) });
      }

      if (action === "create_delivery_note") {
        const { data: po, error: fetchError } = await db
          .from("purchase_orders")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !po) {
          return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }
        if (po.status !== "approved") {
          return NextResponse.json({ error: "Only approved LPOs can have delivery notes" }, { status: 400 });
        }

        const branchCode = await resolveBranchCode(db, po.branch_id);
        const number = await nextProcurementNumber(db, "supplier_delivery_notes", companyId, branchCode, "SDN");
        const lines = (po.lines as LineItem[]) ?? [];

        const { data, error } = await db
          .from("supplier_delivery_notes")
          .insert({
            id: randomUUID(),
            company_id: companyId,
            purchase_order_id: po.id,
            supplier_id: po.supplier_id,
            number,
            date: new Date().toISOString().slice(0, 10),
            status: "draft" satisfies DocumentStatus,
            carrier: body.carrier ? String(body.carrier) : null,
            lines,
            notes: body.notes ? String(body.notes) : null,
          })
          .select("*, suppliers(name), purchase_orders(number)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapSupplierDeliveryNote(data) });
      }

      if (action === "create_mrn") {
        const { data: po, error: fetchError } = await db
          .from("purchase_orders")
          .select("*")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (fetchError || !po) {
          return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }
        if (po.status !== "approved") {
          return NextResponse.json({ error: "Only approved LPOs can be received" }, { status: 400 });
        }

        const branchCode = await resolveBranchCode(db, po.branch_id);
        const number = await nextProcurementNumber(db, "material_receipt_notes", companyId, branchCode, "MRN");
        const lines = (po.lines as LineItem[]) ?? [];
        const priceUpdates: PriceUpdateLine[] = lines.map((line) => ({
          item_id: line.item_id,
          item_name: line.item_name,
          old_unit_price: line.unit_price,
          new_unit_price: line.unit_price,
        }));

        const { data, error } = await db
          .from("material_receipt_notes")
          .insert({
            id: randomUUID(),
            company_id: companyId,
            purchase_order_id: po.id,
            delivery_note_id: body.delivery_note_id ? String(body.delivery_note_id) : null,
            warehouse_id: body.warehouse_id ? String(body.warehouse_id) : null,
            number,
            date: new Date().toISOString().slice(0, 10),
            status: "draft" satisfies DocumentStatus,
            lines,
            price_updates: priceUpdates,
            total: documentTotal(lines),
          })
          .select("*, purchase_orders(number)")
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data: mapMaterialReceiptNote(data) });
      }
    }

    if (resource === "material_receipt_notes" && action === "post") {
      const priceUpdates = body.price_updates as PriceUpdateLine[] | undefined;
      const updates: Record<string, unknown> = { status: "posted" satisfies DocumentStatus };
      if (priceUpdates) updates.price_updates = priceUpdates;

      const { data, error } = await db
        .from("material_receipt_notes")
        .update(updates)
        .eq("id", id)
        .eq("company_id", companyId)
        .eq("status", "draft")
        .select("*, purchase_orders(number)")
        .single();

      if (error) return NextResponse.json({ error: "Only draft MRN can be posted" }, { status: 400 });
      return NextResponse.json({ data: mapMaterialReceiptNote(data) });
    }

    if (resource === "supplier_invoices") {
      if (action === "post") {
        const { data, error } = await db
          .from("supplier_invoices")
          .update({ status: "posted" satisfies DocumentStatus })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "draft")
          .select("*, suppliers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only draft invoices can be posted" }, { status: 400 });
        return NextResponse.json({ data: mapSupplierInvoice(data) });
      }

      if (action === "mark_paid") {
        const { data, error } = await db
          .from("supplier_invoices")
          .update({ is_paid: true })
          .eq("id", id)
          .eq("company_id", companyId)
          .eq("status", "posted")
          .select("*, suppliers(name)")
          .single();
        if (error) return NextResponse.json({ error: "Only posted invoices can be marked paid" }, { status: 400 });
        return NextResponse.json({ data: mapSupplierInvoice(data) });
      }
    }

    if (resource === "purchase_payments" && action === "post") {
      const { data, error } = await db
        .from("purchase_payments")
        .update({ status: "posted" satisfies DocumentStatus })
        .eq("id", id)
        .eq("company_id", companyId)
        .eq("status", "draft")
        .select("*, suppliers(name)")
        .single();
      if (error) return NextResponse.json({ error: "Only draft payments can be posted" }, { status: 400 });
      return NextResponse.json({ data: mapPurchasePayment(data) });
    }

    return NextResponse.json({ error: "Unknown action or resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("access") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
