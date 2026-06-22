import {
  computeThreeWayMatch,
  invoiceLinesFromMrnAndLpo,
  type ThreeWayMatchResult,
} from "@/lib/procurement/three-way-match";
import {
  mapMaterialReceiptNote,
  mapPurchaseOrder,
  mapSupplierInvoice,
  nextProcurementNumber,
  resolveBranchCode,
  supplierInvoiceInsertPayload,
} from "@/lib/server/procurement";
import type { LineItem } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export async function loadMrnForMatch(
  db: Db,
  companyId: string,
  mrnId: string
) {
  const { data: mrn, error } = await db
    .from("material_receipt_notes")
    .select("*, purchase_orders(number, supplier_id, branch_id, lines, suppliers(name))")
    .eq("id", mrnId)
    .eq("company_id", companyId)
    .single();

  if (error || !mrn) throw new Error("MRN not found");

  const po = mrn.purchase_orders as {
    number?: string;
    supplier_id?: string;
    branch_id?: string;
    lines?: LineItem[];
    suppliers?: { name?: string };
  } | null;

  if (!po) throw new Error("Linked LPO not found");

  const { data: poRow } = await db
    .from("purchase_orders")
    .select("*, suppliers(name)")
    .eq("id", mrn.purchase_order_id)
    .eq("company_id", companyId)
    .single();

  if (!poRow) throw new Error("LPO not found");

  return {
    mrn: mapMaterialReceiptNote(mrn),
    po: mapPurchaseOrder(poRow),
  };
}

export async function getThreeWayMatchByMrn(
  db: Db,
  companyId: string,
  mrnId: string,
  supplierInvoiceId?: string
): Promise<ThreeWayMatchResult> {
  const { mrn, po } = await loadMrnForMatch(db, companyId, mrnId);

  let invoiceLines: LineItem[] = [];
  let supplierInvoiceNumber: string | undefined;
  let supplierId = po.supplier_id;
  let supplierName = po.supplier_name;

  if (supplierInvoiceId) {
    const { data: inv } = await db
      .from("supplier_invoices")
      .select("*, suppliers(name)")
      .eq("id", supplierInvoiceId)
      .eq("company_id", companyId)
      .single();

    if (!inv) throw new Error("Supplier invoice not found");
    const mapped = mapSupplierInvoice(inv);
    invoiceLines = mapped.lines;
    supplierInvoiceNumber = mapped.number;
    supplierId = mapped.supplier_id;
    supplierName = mapped.supplier_name;
  }

  return computeThreeWayMatch({
    purchase_order_id: po.id,
    purchase_order_number: po.number,
    mrn_id: mrn.id,
    mrn_number: mrn.number,
    supplier_id: supplierId,
    supplier_name: supplierName,
    lpo_lines: po.lines,
    mrn_lines: mrn.lines,
    mrn_price_updates: mrn.price_updates,
    invoice_lines: invoiceLines,
    supplier_invoice_id: supplierInvoiceId,
    supplier_invoice_number: supplierInvoiceNumber,
  });
}

export async function getThreeWayMatchByInvoice(
  db: Db,
  companyId: string,
  supplierInvoiceId: string
): Promise<ThreeWayMatchResult> {
  const { data: inv, error } = await db
    .from("supplier_invoices")
    .select("*, suppliers(name)")
    .eq("id", supplierInvoiceId)
    .eq("company_id", companyId)
    .single();

  if (error || !inv) throw new Error("Supplier invoice not found");

  const mapped = mapSupplierInvoice(inv);
  if (!mapped.mrn_id) {
    throw new Error("This invoice is not linked to an MRN — 3-way match requires MRN + LPO");
  }

  return getThreeWayMatchByMrn(db, companyId, mapped.mrn_id, supplierInvoiceId);
}

export async function assertThreeWayMatchForPost(
  db: Db,
  companyId: string,
  supplierInvoiceId: string,
  allowVariance: boolean
): Promise<ThreeWayMatchResult> {
  const result = await getThreeWayMatchByInvoice(db, companyId, supplierInvoiceId);
  if (!result.matched && !allowVariance) {
    throw new Error(
      `3-way match failed: ${result.issues.slice(0, 3).join("; ")}${result.issues.length > 3 ? "…" : ""}`
    );
  }
  return result;
}

export async function createSupplierInvoiceFromMrn(
  db: Db,
  companyId: string,
  branchId: string,
  mrnId: string
) {
  const { data: existing } = await db
    .from("supplier_invoices")
    .select("number")
    .eq("company_id", companyId)
    .eq("mrn_id", mrnId)
    .maybeSingle();

  if (existing?.number) {
    throw new Error(`This MRN already has supplier invoice ${existing.number}`);
  }

  const { mrn, po } = await loadMrnForMatch(db, companyId, mrnId);

  if (mrn.status !== "posted") {
    throw new Error("Only posted MRNs can generate a supplier invoice");
  }

  const effectiveBranchId = branchId || po.branch_id;
  const lines = invoiceLinesFromMrnAndLpo(mrn.lines, po.lines);
  const branchCode = await resolveBranchCode(db, effectiveBranchId);
  const number = await nextProcurementNumber(db, "supplier_invoices", companyId, branchCode, "SINV");

  const payload = supplierInvoiceInsertPayload({
    company_id: companyId,
    branch_id: effectiveBranchId,
    supplier_id: po.supplier_id,
    number,
    lines,
    purchase_order_id: po.id,
    mrn_id: mrn.id,
  });

  const { data, error } = await db
    .from("supplier_invoices")
    .insert(payload)
    .select("*, suppliers(name), purchase_orders(number), material_receipt_notes(number)")
    .single();

  if (error) throw new Error(error.message);
  return mapSupplierInvoice(data);
}

/** Preview lines for supplier invoice from MRN (no DB write). */
export async function previewSupplierInvoiceFromMrn(
  db: Db,
  companyId: string,
  mrnId: string
) {
  const { mrn, po } = await loadMrnForMatch(db, companyId, mrnId);
  if (mrn.status !== "posted") {
    throw new Error("Only posted MRNs can generate a supplier invoice");
  }

  const { data: existing } = await db
    .from("supplier_invoices")
    .select("id, number")
    .eq("company_id", companyId)
    .eq("mrn_id", mrnId)
    .maybeSingle();

  const lines = invoiceLinesFromMrnAndLpo(mrn.lines, po.lines);
  const match = computeThreeWayMatch({
    purchase_order_id: po.id,
    purchase_order_number: po.number,
    mrn_id: mrn.id,
    mrn_number: mrn.number,
    supplier_id: po.supplier_id,
    supplier_name: po.supplier_name,
    lpo_lines: po.lines,
    mrn_lines: mrn.lines,
    mrn_price_updates: mrn.price_updates,
    invoice_lines: lines,
  });

  return {
    mrn,
    po,
    lines,
    match,
    existing_invoice: existing
      ? { id: String(existing.id), number: String(existing.number) }
      : null,
  };
}

export async function mrnHasSupplierInvoice(
  db: Db,
  companyId: string,
  mrnId: string
): Promise<{ id: string; number: string } | null> {
  const { data } = await db
    .from("supplier_invoices")
    .select("id, number")
    .eq("company_id", companyId)
    .eq("mrn_id", mrnId)
    .maybeSingle();

  if (!data) return null;
  return { id: String(data.id), number: String(data.number) };
}
