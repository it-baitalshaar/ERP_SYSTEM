import { assertOrgAccess } from "@/lib/server/org-structure";
import type { OrgDataBackupV1, OrgDataScope } from "@/lib/org-data-backup";
import { backupSummary, normalizeOrgDataBackup } from "@/lib/org-data-backup";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

async function logDataOperation(
  db: Db,
  input: {
    organization_id: string;
    scope: OrgDataScope;
    action: "export" | "reset" | "restore" | "delete";
    entity_id: string;
    entity_label: string;
    backup: OrgDataBackupV1;
    performed_by: string;
  }
) {
  const { error } = await db.from("org_data_operations").insert({
    organization_id: input.organization_id,
    scope: input.scope,
    action: input.action,
    entity_id: input.entity_id,
    entity_label: input.entity_label,
    backup: input.backup,
    summary: backupSummary(input.backup),
    performed_by: input.performed_by,
  });
  if (error) {
    throw new Error(`Could not archive operation: ${error.message}. Run migration 0007_org_data_operations.sql`);
  }
}

export async function buildOrgDataBackup(
  db: Db,
  scope: OrgDataScope,
  entityId: string
): Promise<OrgDataBackupV1> {
  if (scope === "unit") {
    const { data: unit, error } = await db.from("companies").select("*").eq("id", entityId).single();
    if (error || !unit) throw new Error("Shop or department not found");

    const [
      { data: branches },
      { data: warehouses },
      { data: customers },
      { data: quotations },
      { data: sales_orders },
      { data: tax_invoices },
      { data: feature_flags },
    ] = await Promise.all([
      db.from("branches").select("*").eq("company_id", entityId),
      db.from("warehouses").select("*").eq("company_id", entityId),
      db.from("customers").select("*").eq("company_id", entityId),
      db.from("quotations").select("*").eq("company_id", entityId),
      db.from("sales_orders").select("*").eq("company_id", entityId),
      db.from("tax_invoices").select("*").eq("company_id", entityId),
      db.from("feature_flags").select("*").eq("company_id", entityId),
    ]);

    return {
      version: 1,
      scope: "unit",
      exported_at: new Date().toISOString(),
      organization_id: unit.organization_id,
      label: unit.name,
      unit,
      branches: branches ?? [],
      warehouses: warehouses ?? [],
      customers: customers ?? [],
      quotations: quotations ?? [],
      sales_orders: sales_orders ?? [],
      tax_invoices: tax_invoices ?? [],
      feature_flags: feature_flags ?? [],
    };
  }

  if (scope === "branch") {
    const { data: branch, error } = await db.from("branches").select("*").eq("id", entityId).single();
    if (error || !branch) throw new Error("Branch not found");

    const { data: company } = await db
      .from("companies")
      .select("organization_id")
      .eq("id", branch.company_id)
      .single();
    if (!company?.organization_id) throw new Error("Parent unit not found");

    const [{ data: quotations }, { data: sales_orders }, { data: tax_invoices }] = await Promise.all([
      db.from("quotations").select("*").eq("branch_id", entityId),
      db.from("sales_orders").select("*").eq("branch_id", entityId),
      db.from("tax_invoices").select("*").eq("branch_id", entityId),
    ]);

    return {
      version: 1,
      scope: "branch",
      exported_at: new Date().toISOString(),
      organization_id: company.organization_id,
      label: `${branch.code} — ${branch.name}`,
      branch,
      quotations: quotations ?? [],
      sales_orders: sales_orders ?? [],
      tax_invoices: tax_invoices ?? [],
    };
  }

  const { data: warehouse, error } = await db
    .from("warehouses")
    .select("*")
    .eq("id", entityId)
    .single();
  if (error || !warehouse) throw new Error("Warehouse not found");

  const { data: company } = await db
    .from("companies")
    .select("organization_id")
    .eq("id", warehouse.company_id)
    .single();
  if (!company?.organization_id) throw new Error("Parent unit not found");

  return {
    version: 1,
    scope: "warehouse",
    exported_at: new Date().toISOString(),
    organization_id: company.organization_id,
    label: `${warehouse.code} — ${warehouse.name}`,
    warehouse,
  };
}

async function deleteSalesByCompany(db: Db, companyId: string) {
  await db.from("tax_invoices").delete().eq("company_id", companyId);
  await db.from("sales_orders").delete().eq("company_id", companyId);
  await db.from("quotations").delete().eq("company_id", companyId);
  await db.from("customers").delete().eq("company_id", companyId);
}

async function deleteSalesByBranch(db: Db, branchId: string) {
  await db.from("tax_invoices").delete().eq("branch_id", branchId);
  await db.from("sales_orders").delete().eq("branch_id", branchId);
  await db.from("quotations").delete().eq("branch_id", branchId);
}

function stripRow<T extends Record<string, unknown>>(row: T, omit: string[] = []): T {
  const next = { ...row };
  for (const key of omit) delete next[key];
  return next;
}

async function upsertCustomers(
  db: Db,
  rows: Record<string, unknown>[],
  companyId: string
) {
  for (const row of rows) {
    const payload = stripRow(row, ["created_at", "updated_at"]);
    payload.company_id = companyId;
    const { error } = await db.from("customers").upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
}

async function upsertSalesDocs(
  db: Db,
  table: "quotations" | "sales_orders" | "tax_invoices",
  rows: Record<string, unknown>[],
  companyId: string,
  branchId?: string
) {
  for (const row of rows) {
    const payload = stripRow(row, ["created_at"]);
    payload.company_id = companyId;
    if (branchId) payload.branch_id = branchId;
    const { error } = await db.from(table).upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
}

async function upsertFeatureFlags(
  db: Db,
  rows: Record<string, unknown>[],
  companyId: string
) {
  for (const row of rows) {
    const flag_key = String(row.flag_key);
    const enabled = Boolean(row.enabled);
    const { error } = await db.from("feature_flags").upsert(
      { company_id: companyId, flag_key, enabled },
      { onConflict: "company_id,flag_key" }
    );
    if (error) throw new Error(error.message);
  }
}

export async function resetOrgData(
  db: Db,
  userId: string,
  input: {
    scope: OrgDataScope;
    entity_id: string;
    confirm_name: string;
  }
): Promise<{ backup: OrgDataBackupV1; organization_id: string }> {
  const backup = await buildOrgDataBackup(db, input.scope, input.entity_id);
  const confirm = input.confirm_name.trim();

  if (backup.scope === "unit") {
    if (confirm !== backup.label.trim()) {
      throw new Error("Confirmation name does not match the shop or department name");
    }
    await assertOrgAccess(db, userId, backup.organization_id);
    await deleteSalesByCompany(db, input.entity_id);
  } else if (backup.scope === "branch") {
    const branchName = String(backup.branch?.name ?? "");
    const branchCode = String(backup.branch?.code ?? "");
    if (confirm !== branchName.trim() && confirm !== branchCode.trim()) {
      throw new Error("Type the branch name or code to confirm");
    }
    await assertOrgAccess(db, userId, backup.organization_id);
    await deleteSalesByBranch(db, input.entity_id);
  } else {
    const warehouseName = String(backup.warehouse?.name ?? "");
    const warehouseCode = String(backup.warehouse?.code ?? "");
    if (confirm !== warehouseName.trim() && confirm !== warehouseCode.trim()) {
      throw new Error("Type the warehouse name or code to confirm");
    }
    await assertOrgAccess(db, userId, backup.organization_id);
    // No transactional warehouse tables yet — structure is kept; backup archives current profile.
  }

  await logDataOperation(db, {
    organization_id: backup.organization_id,
    scope: backup.scope,
    action: "reset",
    entity_id: input.entity_id,
    entity_label: backup.label,
    backup,
    performed_by: userId,
  });

  return { backup, organization_id: backup.organization_id };
}

export async function restoreOrgData(
  db: Db,
  userId: string,
  input: {
    target_id: string;
    confirm_name: string;
    backup: unknown;
  }
): Promise<{ backup: OrgDataBackupV1; organization_id: string }> {
  const backup = normalizeOrgDataBackup(input.backup);
  await assertOrgAccess(db, userId, backup.organization_id);

  if (backup.scope === "unit") {
    const { data: target } = await db
      .from("companies")
      .select("id, name, organization_id")
      .eq("id", input.target_id)
      .single();

    if (!target || target.organization_id !== backup.organization_id) {
      throw new Error("Restore target must be a shop or department in the same organization");
    }
    if (input.confirm_name.trim() !== target.name.trim()) {
      throw new Error("Confirmation name does not match the target shop or department");
    }

    const unitFields = backup.unit ? stripRow(backup.unit, ["id", "organization_id", "created_at", "updated_at"]) : {};
    if (Object.keys(unitFields).length) {
      const { error } = await db.from("companies").update(unitFields).eq("id", input.target_id);
      if (error) throw new Error(error.message);
    }

    await deleteSalesByCompany(db, input.target_id);

    await upsertCustomers(db, backup.customers ?? [], input.target_id);
    await upsertSalesDocs(db, "quotations", backup.quotations ?? [], input.target_id);
    await upsertSalesDocs(db, "sales_orders", backup.sales_orders ?? [], input.target_id);
    await upsertSalesDocs(db, "tax_invoices", backup.tax_invoices ?? [], input.target_id);
    await upsertFeatureFlags(db, backup.feature_flags ?? [], input.target_id);

    for (const branch of backup.branches ?? []) {
      const branchId = String(branch.id);
      const { data: exists } = await db.from("branches").select("id").eq("id", branchId).maybeSingle();
      if (!exists) continue;
      const fields = stripRow(branch, ["id", "company_id", "created_at"]);
      fields.company_id = input.target_id;
      await db.from("branches").update(fields).eq("id", branchId);
    }

    for (const warehouse of backup.warehouses ?? []) {
      const warehouseId = String(warehouse.id);
      const { data: exists } = await db.from("warehouses").select("id").eq("id", warehouseId).maybeSingle();
      if (!exists) continue;
      const fields = stripRow(warehouse, ["id", "company_id", "created_at"]);
      fields.company_id = input.target_id;
      await db.from("warehouses").update(fields).eq("id", warehouseId);
    }
  } else if (backup.scope === "branch") {
    const { data: target } = await db
      .from("branches")
      .select("id, name, code, company_id")
      .eq("id", input.target_id)
      .single();

    if (!target) throw new Error("Branch not found");

    const { data: company } = await db
      .from("companies")
      .select("organization_id")
      .eq("id", target.company_id)
      .single();

    if (!company || company.organization_id !== backup.organization_id) {
      throw new Error("Restore target must be a branch in the same organization");
    }
    const confirm = input.confirm_name.trim();
    if (confirm !== target.name.trim() && confirm !== target.code.trim()) {
      throw new Error("Type the branch name or code to confirm");
    }

    if (backup.branch) {
      const fields = stripRow(backup.branch, ["id", "company_id", "created_at"]);
      await db.from("branches").update(fields).eq("id", input.target_id);
    }

    await deleteSalesByBranch(db, input.target_id);

    const companyId = target.company_id;
    await upsertSalesDocs(db, "quotations", backup.quotations ?? [], companyId, input.target_id);
    await upsertSalesDocs(db, "sales_orders", backup.sales_orders ?? [], companyId, input.target_id);
    await upsertSalesDocs(db, "tax_invoices", backup.tax_invoices ?? [], companyId, input.target_id);
  } else {
    const { data: target } = await db
      .from("warehouses")
      .select("id, name, code, company_id")
      .eq("id", input.target_id)
      .single();

    if (!target) throw new Error("Warehouse not found");

    const { data: company } = await db
      .from("companies")
      .select("organization_id")
      .eq("id", target.company_id)
      .single();

    if (!company || company.organization_id !== backup.organization_id) {
      throw new Error("Restore target must be a warehouse in the same organization");
    }
    const confirm = input.confirm_name.trim();
    if (confirm !== target.name.trim() && confirm !== target.code.trim()) {
      throw new Error("Type the warehouse name or code to confirm");
    }

    if (backup.warehouse) {
      const fields = stripRow(backup.warehouse, ["id", "company_id", "created_at"]);
      await db.from("warehouses").update(fields).eq("id", input.target_id);
    }
  }

  await logDataOperation(db, {
    organization_id: backup.organization_id,
    scope: backup.scope,
    action: "restore",
    entity_id: input.target_id,
    entity_label: backup.label,
    backup,
    performed_by: userId,
  });

  return { backup, organization_id: backup.organization_id };
}

export async function exportOrgData(
  db: Db,
  userId: string,
  scope: OrgDataScope,
  entityId: string
): Promise<OrgDataBackupV1> {
  const backup = await buildOrgDataBackup(db, scope, entityId);
  await assertOrgAccess(db, userId, backup.organization_id);

  await logDataOperation(db, {
    organization_id: backup.organization_id,
    scope,
    action: "export",
    entity_id: entityId,
    entity_label: backup.label,
    backup,
    performed_by: userId,
  });

  return backup;
}

export async function deleteBranch(
  db: Db,
  userId: string,
  input: {
    branch_id: string;
    confirm_name: string;
    transfer_to_branch_id?: string;
  }
): Promise<{ backup: OrgDataBackupV1; organization_id: string }> {
  const backup = await buildOrgDataBackup(db, "branch", input.branch_id);
  const branch = backup.branch;
  if (!branch) throw new Error("Branch not found");

  const confirm = input.confirm_name.trim();
  const branchName = String(branch.name ?? "").trim();
  const branchCode = String(branch.code ?? "").trim();
  if (confirm !== branchName && confirm !== branchCode) {
    throw new Error("Confirmation name does not match the branch name or code");
  }

  await assertOrgAccess(db, userId, backup.organization_id);

  const companyId = String(branch.company_id);
  const hasSales =
    (backup.quotations?.length ?? 0) > 0 ||
    (backup.sales_orders?.length ?? 0) > 0 ||
    (backup.tax_invoices?.length ?? 0) > 0;

  if (hasSales) {
    const transferId = input.transfer_to_branch_id?.trim();
    if (!transferId) {
      throw new Error("Select another branch to receive quotations, orders, and invoices");
    }
    if (transferId === input.branch_id) {
      throw new Error("Transfer target must be a different branch");
    }

    const { data: target } = await db
      .from("branches")
      .select("id, company_id")
      .eq("id", transferId)
      .single();

    if (!target || target.company_id !== companyId) {
      throw new Error("Transfer target must be a branch under the same shop or department");
    }

    const tables = ["tax_invoices", "sales_orders", "quotations"] as const;
    for (const table of tables) {
      const { error } = await db
        .from(table)
        .update({ branch_id: transferId })
        .eq("branch_id", input.branch_id);
      if (error) throw new Error(error.message);
    }
  }

  await db.from("user_branches").delete().eq("branch_id", input.branch_id);

  const { error: deleteError } = await db.from("branches").delete().eq("id", input.branch_id);
  if (deleteError) throw new Error(deleteError.message);

  await logDataOperation(db, {
    organization_id: backup.organization_id,
    scope: "branch",
    action: "delete",
    entity_id: input.branch_id,
    entity_label: backup.label,
    backup,
    performed_by: userId,
  });

  return { backup, organization_id: backup.organization_id };
}
