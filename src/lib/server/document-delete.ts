import { isAdminRole } from "@/lib/permissions";
import type { DeleteBlocker, DeleteCheckResult, DocumentModule } from "@/lib/documents/delete-types";
import { applyStockMovement } from "@/lib/server/inventory";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

const PROC_ROUTES: Record<string, string> = {
  material_requests: "/procurement/requisitions",
  purchase_orders: "/procurement/orders",
  proforma_invoices: "/procurement/proforma",
  supplier_delivery_notes: "/procurement/delivery-notes",
  material_receipt_notes: "/procurement/goods-receipt",
  supplier_invoices: "/procurement/supplier-invoices",
  purchase_payments: "/procurement/payments",
};

const SALES_ROUTES: Record<string, string> = {
  quotations: "/sales/quotations",
  sales_orders: "/sales/orders",
  tax_invoices: "/sales/invoices",
  delivery_notes: "/sales/delivery-notes",
};

const PROC_PRIORITY: Record<string, number> = {
  purchase_payments: 70,
  supplier_invoices: 60,
  material_receipt_notes: 50,
  supplier_delivery_notes: 40,
  proforma_invoices: 30,
  purchase_orders: 20,
  material_requests: 10,
};

const SALES_PRIORITY: Record<string, number> = {
  delivery_notes: 30,
  tax_invoices: 20,
  sales_orders: 10,
  quotations: 5,
};

const PROC_DELETE_ORDER =
  "Payments → Supplier Invoices → MRNs → Supplier Delivery Notes → Proforma Invoices → LPO → Material Request";

const SALES_DELETE_ORDER = "Delivery Notes → Tax Invoices → Sales Orders → Quotations";

function assertAdmin(roleId: string) {
  if (!isAdminRole(roleId)) {
    throw new Error("Only administrators can delete documents");
  }
}

function makeBlocker(
  table: string,
  kind: string,
  row: { id: string; number: string; status?: string },
  hint: string,
  routes: Record<string, string>,
  priority: number
): DeleteBlocker {
  return {
    kind,
    id: String(row.id),
    number: String(row.number),
    status: row.status ? String(row.status) : undefined,
    href: routes[table] ?? "/",
    hint,
    priority,
  };
}

function sortBlockers(blockers: DeleteBlocker[]): DeleteBlocker[] {
  return [...blockers].sort((a, b) => b.priority - a.priority);
}

function statusWarnings(status: string): string[] {
  const warnings: string[] = [];
  if (status === "approved") {
    warnings.push("This document is approved.");
  }
  if (status === "posted") {
    warnings.push("This document is posted.");
  }
  if (status === "pending_approval") {
    warnings.push("This document is pending approval.");
  }
  return warnings;
}

async function reverseStockForReference(
  db: Db,
  companyId: string,
  referenceType: string,
  referenceId: string,
  referenceNumber: string
) {
  const { data: movements } = await db
    .from("stock_movements")
    .select("*")
    .eq("company_id", companyId)
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId);

  if (!movements?.length) return;

  for (const m of movements) {
    const reverseType = m.movement_type === "in" ? "out" : "in";
    await applyStockMovement(db, {
      company_id: companyId,
      item_id: String(m.item_id),
      warehouse_id: String(m.warehouse_id),
      movement_type: reverseType,
      qty: Number(m.qty),
      reference_type: `${referenceType}_reversal`,
      reference_id: referenceId,
      reference_number: referenceNumber,
      notes: "Reversal — document deleted by administrator",
    });
  }

  await db
    .from("stock_movements")
    .delete()
    .eq("company_id", companyId)
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId);
}

async function fetchRows(
  db: Db,
  table: string,
  companyId: string,
  filter: Record<string, string>
) {
  let q = db.from(table).select("id, number, status").eq("company_id", companyId);
  for (const [key, value] of Object.entries(filter)) {
    q = q.eq(key, value);
  }
  const { data } = await q;
  return (data ?? []) as { id: string; number: string; status?: string }[];
}

async function getDocumentMeta(
  db: Db,
  table: string,
  companyId: string,
  id: string
): Promise<{ number: string; status: string } | null> {
  const { data } = await db
    .from(table)
    .select("number, status")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { number: String(data.number), status: String(data.status ?? "draft") };
}

async function checkProcurementDelete(
  db: Db,
  resource: string,
  companyId: string,
  id: string
): Promise<DeleteCheckResult> {
  const meta = await getDocumentMeta(db, resource, companyId, id);
  if (!meta) throw new Error("Document not found");

  const blockers: DeleteBlocker[] = [];
  const warnings = statusWarnings(meta.status);

  const add = (
    table: string,
    kind: string,
    rows: { id: string; number: string; status?: string }[],
    hint: string
  ) => {
    for (const row of rows) {
      blockers.push(
        makeBlocker(
          table,
          kind,
          row,
          hint,
          PROC_ROUTES,
          PROC_PRIORITY[table] ?? 0
        )
      );
    }
  };

  if (resource === "material_requests") {
    add(
      "purchase_orders",
      "Purchase Order (LPO)",
      await fetchRows(db, "purchase_orders", companyId, { material_request_id: id }),
      "Delete this LPO from Purchase Orders first"
    );
  }

  if (resource === "purchase_orders") {
    add(
      "purchase_payments",
      "Purchase Payment",
      await fetchRows(db, "purchase_payments", companyId, { purchase_order_id: id }),
      "Delete this payment from Purchase Payments first"
    );
    add(
      "supplier_invoices",
      "Supplier Invoice",
      await fetchRows(db, "supplier_invoices", companyId, { purchase_order_id: id }),
      "Delete this supplier invoice first"
    );
    add(
      "material_receipt_notes",
      "Material Receipt Note (MRN)",
      await fetchRows(db, "material_receipt_notes", companyId, { purchase_order_id: id }),
      "Delete this MRN from Goods Receipt first"
    );
    add(
      "supplier_delivery_notes",
      "Supplier Delivery Note",
      await fetchRows(db, "supplier_delivery_notes", companyId, { purchase_order_id: id }),
      "Delete this supplier delivery note first"
    );
    add(
      "proforma_invoices",
      "Proforma Invoice",
      await fetchRows(db, "proforma_invoices", companyId, { purchase_order_id: id }),
      "Delete this proforma invoice first"
    );
  }

  if (resource === "supplier_delivery_notes") {
    add(
      "material_receipt_notes",
      "Material Receipt Note (MRN)",
      await fetchRows(db, "material_receipt_notes", companyId, { delivery_note_id: id }),
      "Delete the linked MRN from Goods Receipt first"
    );
  }

  if (resource === "material_receipt_notes") {
    add(
      "supplier_invoices",
      "Supplier Invoice",
      await fetchRows(db, "supplier_invoices", companyId, { mrn_id: id }),
      "Delete this supplier invoice first"
    );
    if (meta.status === "posted") {
      warnings.push(
        "Posting updated inventory. Deleting will reverse stock movements (item price changes from MRN post are not reverted)."
      );
    }
  }

  if (resource === "supplier_invoices") {
    add(
      "purchase_payments",
      "Purchase Payment",
      await fetchRows(db, "purchase_payments", companyId, { supplier_invoice_id: id }),
      "Delete this payment from Purchase Payments first"
    );
    if (meta.status === "posted") {
      warnings.push("This supplier invoice was posted to accounts payable.");
    }
  }

  const sorted = sortBlockers(blockers);

  return {
    allowed: sorted.length === 0,
    blockers: sorted,
    warnings,
    document_number: meta.number,
    document_status: meta.status,
    delete_order_hint: blockers.length ? PROC_DELETE_ORDER : undefined,
  };
}

async function checkSalesDelete(
  db: Db,
  resource: string,
  companyId: string,
  id: string
): Promise<DeleteCheckResult> {
  const table =
    resource === "orders"
      ? "sales_orders"
      : resource === "invoices"
        ? "tax_invoices"
        : resource;

  const meta = await getDocumentMeta(db, table, companyId, id);
  if (!meta) throw new Error("Document not found");

  const blockers: DeleteBlocker[] = [];
  const warnings = statusWarnings(meta.status);

  const add = (
    t: string,
    kind: string,
    rows: { id: string; number: string; status?: string }[],
    hint: string
  ) => {
    for (const row of rows) {
      blockers.push(
        makeBlocker(t, kind, row, hint, SALES_ROUTES, SALES_PRIORITY[t] ?? 0)
      );
    }
  };

  if (table === "sales_orders") {
    add(
      "tax_invoices",
      "Tax Invoice",
      await fetchRows(db, "tax_invoices", companyId, { sales_order_id: id }),
      "Delete this tax invoice from Sales Invoices first"
    );
  }

  if (table === "tax_invoices") {
    add(
      "delivery_notes",
      "Delivery Note",
      await fetchRows(db, "delivery_notes", companyId, { invoice_id: id }),
      "Delete this delivery note first"
    );
    if (meta.status === "posted") {
      warnings.push("Deleting a posted invoice will reduce the customer outstanding balance.");
    }
  }

  if (table === "delivery_notes" && meta.status === "posted") {
    warnings.push("Deleting will reverse stock movements from this delivery note.");
  }

  const sorted = sortBlockers(blockers);

  return {
    allowed: sorted.length === 0,
    blockers: sorted,
    warnings,
    document_number: meta.number,
    document_status: meta.status,
    delete_order_hint: blockers.length ? SALES_DELETE_ORDER : undefined,
  };
}

export async function checkDocumentDelete(
  roleId: string,
  module: DocumentModule,
  resource: string,
  companyId: string,
  id: string
): Promise<DeleteCheckResult> {
  assertAdmin(roleId);

  const db = createAdminClientOrNull();
  if (!db) throw new Error("Database not configured");

  if (module === "procurement") {
    return checkProcurementDelete(db, resource, companyId, id);
  }
  return checkSalesDelete(db, resource, companyId, id);
}

async function executeProcurementDelete(
  db: Db,
  resource: string,
  companyId: string,
  id: string
) {
  const check = await checkProcurementDelete(db, resource, companyId, id);
  if (!check.allowed) {
    const first = check.blockers[0];
    throw new Error(
      first
        ? `Cannot delete — ${first.kind} ${first.number} is still linked. ${first.hint}.`
        : "Cannot delete — linked documents exist"
    );
  }

  if (resource === "material_receipt_notes" && check.document_status === "posted") {
    await reverseStockForReference(db, companyId, "mrn", id, check.document_number);
  }

  const { error } = await db.from(resource).delete().eq("company_id", companyId).eq("id", id);
  if (error) throw new Error(error.message);
}

async function executeSalesDelete(
  db: Db,
  resource: string,
  companyId: string,
  id: string
) {
  const table =
    resource === "orders"
      ? "sales_orders"
      : resource === "invoices"
        ? "tax_invoices"
        : resource;

  const check = await checkSalesDelete(db, table, companyId, id);
  if (!check.allowed) {
    const first = check.blockers[0];
    throw new Error(
      first
        ? `Cannot delete — ${first.kind} ${first.number} is still linked. ${first.hint}.`
        : "Cannot delete — linked documents exist"
    );
  }

  if (table === "delivery_notes" && check.document_status === "posted") {
    await reverseStockForReference(db, companyId, "delivery_note", id, check.document_number);
  }

  if (table === "tax_invoices" && check.document_status === "posted") {
    const { data: invoice } = await db
      .from("tax_invoices")
      .select("customer_id, total")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (invoice?.customer_id) {
      const { data: customer } = await db
        .from("customers")
        .select("outstanding_balance, credit_limit")
        .eq("id", invoice.customer_id)
        .single();

      const newBalance = Math.max(
        0,
        Number(customer?.outstanding_balance ?? 0) - Number(invoice.total ?? 0)
      );
      const creditLimit = Number(customer?.credit_limit ?? 0);
      const shouldBlock = creditLimit > 0 && newBalance > creditLimit;

      await db
        .from("customers")
        .update({
          outstanding_balance: newBalance,
          is_blocked: shouldBlock,
        })
        .eq("id", invoice.customer_id);
    }
  }

  const { error } = await db.from(table).delete().eq("company_id", companyId).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDocument(
  roleId: string,
  module: DocumentModule,
  resource: string,
  companyId: string,
  id: string
): Promise<void> {
  assertAdmin(roleId);

  const db = createAdminClientOrNull();
  if (!db) throw new Error("Database not configured");

  if (module === "procurement") {
    await executeProcurementDelete(db, resource, companyId, id);
    return;
  }
  await executeSalesDelete(db, resource, companyId, id);
}
