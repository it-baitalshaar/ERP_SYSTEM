import { isAdminRole } from "@/lib/permissions";
import type { DeleteBlocker, DeleteCheckResult } from "@/lib/documents/delete-types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

const SALES_ROUTES: Record<string, string> = {
  quotations: "/sales/quotations",
  sales_orders: "/sales/orders",
  tax_invoices: "/sales/invoices",
};

function assertAdmin(roleId: string) {
  if (!isAdminRole(roleId)) {
    throw new Error("Only administrators can delete customers");
  }
}

async function fetchLinked(
  db: Db,
  table: string,
  companyId: string,
  customerId: string
) {
  const { data } = await db
    .from(table)
    .select("id, number, status")
    .eq("company_id", companyId)
    .eq("customer_id", customerId);
  return (data ?? []) as { id: string; number: string; status?: string }[];
}

export async function checkCustomerDelete(
  db: Db,
  companyId: string,
  customerId: string
): Promise<DeleteCheckResult> {
  const { data: customer } = await db
    .from("customers")
    .select("name, phone, outstanding_balance, is_blocked")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!customer) throw new Error("Customer not found");

  const blockers: DeleteBlocker[] = [];
  const warnings: string[] = [];

  const add = (
    table: string,
    kind: string,
    rows: { id: string; number: string; status?: string }[],
    hint: string,
    priority: number
  ) => {
    for (const row of rows) {
      blockers.push({
        kind,
        id: row.id,
        number: row.number,
        status: row.status,
        href: SALES_ROUTES[table] ?? "/sales",
        hint,
        priority,
      });
    }
  };

  add(
    "tax_invoices",
    "Tax Invoice",
    await fetchLinked(db, "tax_invoices", companyId, customerId),
    "Delete this tax invoice from Sales Invoices first",
    30
  );
  add(
    "sales_orders",
    "Sales Order",
    await fetchLinked(db, "sales_orders", companyId, customerId),
    "Delete this sales order from Sales Orders first",
    20
  );
  add(
    "quotations",
    "Quotation",
    await fetchLinked(db, "quotations", companyId, customerId),
    "Delete this quotation from Sales Quotations first",
    10
  );

  const balance = Number(customer.outstanding_balance ?? 0);
  if (balance > 0) {
    warnings.push(
      `Customer has outstanding balance of AED ${balance.toLocaleString()} — deleting removes this history link only (posted invoices should be cleared first).`
    );
  }
  if (customer.is_blocked) {
    warnings.push("This customer is blocked.");
  }

  const sorted = [...blockers].sort((a, b) => b.priority - a.priority);

  return {
    allowed: sorted.length === 0,
    blockers: sorted,
    warnings,
    document_number: String(customer.name),
    document_status: balance > 0 ? "has balance" : "active",
    delete_order_hint: blockers.length
      ? "Tax Invoices → Sales Orders → Quotations → Customer"
      : undefined,
  };
}

export async function deleteCustomer(
  roleId: string,
  companyId: string,
  customerId: string
): Promise<void> {
  assertAdmin(roleId);

  const db = createAdminClientOrNull();
  if (!db) throw new Error("Database not configured");

  const check = await checkCustomerDelete(db, companyId, customerId);
  if (!check.allowed) {
    const first = check.blockers[0];
    throw new Error(
      first
        ? `Cannot delete — ${first.kind} ${first.number} is still linked. ${first.hint}.`
        : "Cannot delete — linked sales documents exist"
    );
  }

  const { error } = await db
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
}
