import { randomUUID } from "crypto";
import { getEnabledFlagKeysForBusinessLines } from "@/lib/feature-flags";
import type { BusinessLine, UnitType } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export async function assertOrgAccess(db: Db, userId: string, organizationId: string) {
  const { data } = await db
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) throw new Error("You do not have access to this organization");
}

export async function loadOrgStructure(db: Db, organizationId: string) {
  const { data: org, error: orgError } = await db
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (orgError || !org) throw new Error("Organization not found");

  const { data: units } = await db
    .from("companies")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  const unitIds = (units ?? []).map((u) => u.id);

  const { data: branches } = unitIds.length
    ? await db.from("branches").select("*").in("company_id", unitIds).order("code")
    : { data: [] };

  const { data: warehouses } = unitIds.length
    ? await db.from("warehouses").select("*").in("company_id", unitIds).order("code")
    : { data: [] };

  return {
    organization: {
      id: org.id,
      name: org.name,
      trade_license_no: org.trade_license_no ?? "",
      address: org.address ?? "",
      currency: org.currency,
      vat_trn: org.vat_trn ?? "",
    },
    units: (units ?? []).map((unit) => ({
      id: unit.id,
      organization_id: unit.organization_id,
      unit_type: unit.unit_type as UnitType,
      name: unit.name,
      trade_license_no: unit.trade_license_no ?? "",
      currency: unit.currency,
      address: unit.address ?? "",
      vat_trn: unit.vat_trn ?? "",
      fiscal_year_start: unit.fiscal_year_start ?? "01-01",
      business_lines: (unit.business_lines ?? []) as BusinessLine[],
      branches: (branches ?? [])
        .filter((b) => b.company_id === unit.id)
        .map((b) => ({
          id: b.id,
          company_id: b.company_id,
          name: b.name,
          code: b.code,
          address: b.address ?? "",
          trade_license_no: b.trade_license_no ?? "",
          is_head_office: b.is_head_office,
        })),
      warehouses: (warehouses ?? [])
        .filter((w) => w.company_id === unit.id)
        .map((w) => ({
          id: w.id,
          company_id: w.company_id,
          name: w.name,
          code: w.code,
          address: w.address ?? "",
          trade_license_no: w.trade_license_no ?? "",
        })),
    })),
  };
}

export async function createUnit(
  db: Db,
  userId: string,
  input: {
    organization_id: string;
    name: string;
    unit_type: UnitType;
    trade_license_no: string;
    business_lines?: BusinessLine[];
    address?: string;
    currency?: string;
    vat_trn?: string;
    fiscal_year_start?: string;
  }
) {
  await assertOrgAccess(db, userId, input.organization_id);

  const { data: org } = await db
    .from("organizations")
    .select("currency")
    .eq("id", input.organization_id)
    .single();

  const businessLines: BusinessLine[] =
    input.business_lines?.length ? input.business_lines : ["trading"];

  const companyId = randomUUID();
  const { error } = await db.from("companies").insert({
    id: companyId,
    organization_id: input.organization_id,
    unit_type: input.unit_type,
    name: input.name.trim(),
    trade_license_no: input.trade_license_no.trim(),
    currency: input.currency?.trim() || org?.currency || "AED",
    fiscal_year_start: input.fiscal_year_start?.trim() || "01-01",
    business_lines: businessLines,
    address: input.address?.trim() ?? "",
    vat_trn: input.vat_trn?.trim() ?? "",
  });

  if (error) throw new Error(error.message);

  await db.from("user_companies").insert({ user_id: userId, company_id: companyId });

  const flagKeys = getEnabledFlagKeysForBusinessLines(businessLines);
  await db.from("feature_flags").insert(
    Array.from(flagKeys).map((flag_key) => ({
      company_id: companyId,
      flag_key,
      enabled: true,
    }))
  );

  return companyId;
}

export interface UnitDeletionBackup {
  exported_at: string;
  organization_id: string;
  unit: Record<string, unknown>;
  branches: Record<string, unknown>[];
  warehouses: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  quotations: Record<string, unknown>[];
  sales_orders: Record<string, unknown>[];
  tax_invoices: Record<string, unknown>[];
  feature_flags: Record<string, unknown>[];
}

export async function buildUnitBackup(db: Db, unitId: string): Promise<UnitDeletionBackup> {
  const { data: unit, error: unitError } = await db
    .from("companies")
    .select("*")
    .eq("id", unitId)
    .single();

  if (unitError || !unit) throw new Error("Department not found");

  const [
    { data: branches },
    { data: warehouses },
    { data: customers },
    { data: quotations },
    { data: sales_orders },
    { data: tax_invoices },
    { data: feature_flags },
  ] = await Promise.all([
    db.from("branches").select("*").eq("company_id", unitId),
    db.from("warehouses").select("*").eq("company_id", unitId),
    db.from("customers").select("*").eq("company_id", unitId),
    db.from("quotations").select("*").eq("company_id", unitId),
    db.from("sales_orders").select("*").eq("company_id", unitId),
    db.from("tax_invoices").select("*").eq("company_id", unitId),
    db.from("feature_flags").select("*").eq("company_id", unitId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    organization_id: unit.organization_id,
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

async function assertBranchCodesUniqueOnTarget(
  db: Db,
  targetCompanyId: string,
  branchIds: string[]
) {
  if (!branchIds.length) return;

  const { data: moving } = await db.from("branches").select("id, code").in("id", branchIds);
  const { data: existing } = await db
    .from("branches")
    .select("code")
    .eq("company_id", targetCompanyId);

  const existingCodes = new Set((existing ?? []).map((b) => b.code.toUpperCase()));
  const conflicts = (moving ?? [])
    .filter((b) => existingCodes.has(b.code.toUpperCase()))
    .map((b) => b.code);

  if (conflicts.length) {
    throw new Error(
      `Branch code conflict on target unit: ${conflicts.join(", ")}. Rename branches before deleting.`
    );
  }
}

async function assertWarehouseCodesUniqueOnTarget(
  db: Db,
  targetCompanyId: string,
  warehouseIds: string[]
) {
  if (!warehouseIds.length) return;

  const { data: moving } = await db.from("warehouses").select("id, code").in("id", warehouseIds);
  const { data: existing } = await db
    .from("warehouses")
    .select("code")
    .eq("company_id", targetCompanyId);

  const existingCodes = new Set((existing ?? []).map((w) => w.code.toUpperCase()));
  const conflicts = (moving ?? [])
    .filter((w) => existingCodes.has(w.code.toUpperCase()))
    .map((w) => w.code);

  if (conflicts.length) {
    throw new Error(
      `Warehouse code conflict on target unit: ${conflicts.join(", ")}. Rename warehouses before deleting.`
    );
  }
}

export async function deleteDepartment(
  db: Db,
  userId: string,
  input: {
    unit_id: string;
    confirm_name: string;
    transfer_to_unit_id?: string;
  }
): Promise<{ backup: UnitDeletionBackup; organization_id: string }> {
  const { data: unit } = await db.from("companies").select("*").eq("id", input.unit_id).single();

  if (!unit) throw new Error("Department not found");
  if (unit.unit_type !== "department") {
    throw new Error("Only departments can be deleted from this action. Shops must be handled separately.");
  }
  if (unit.name.trim() !== input.confirm_name.trim()) {
    throw new Error("Confirmation name does not match the department name");
  }

  await assertOrgAccess(db, userId, unit.organization_id);

  const backup = await buildUnitBackup(db, input.unit_id);

  const hasSites = backup.branches.length > 0 || backup.warehouses.length > 0;
  const hasTransactionalData =
    backup.customers.length > 0 ||
    backup.quotations.length > 0 ||
    backup.sales_orders.length > 0 ||
    backup.tax_invoices.length > 0;

  if (hasSites || hasTransactionalData) {
    const transferId = input.transfer_to_unit_id?.trim();
    if (!transferId) {
      throw new Error(
        "Select another shop or department to receive branches, warehouses, and related records"
      );
    }
    if (transferId === input.unit_id) {
      throw new Error("Transfer target must be a different unit");
    }

    const { data: target } = await db
      .from("companies")
      .select("id, organization_id")
      .eq("id", transferId)
      .single();

    if (!target || target.organization_id !== unit.organization_id) {
      throw new Error("Transfer target must belong to the same organization");
    }

    const branchIds = backup.branches.map((b) => String(b.id));
    const warehouseIds = backup.warehouses.map((w) => String(w.id));

    await assertBranchCodesUniqueOnTarget(db, transferId, branchIds);
    await assertWarehouseCodesUniqueOnTarget(db, transferId, warehouseIds);

    if (branchIds.length) {
      const { error } = await db
        .from("branches")
        .update({ company_id: transferId })
        .in("id", branchIds);
      if (error) throw new Error(error.message);
    }

    if (warehouseIds.length) {
      const { error } = await db
        .from("warehouses")
        .update({ company_id: transferId })
        .in("id", warehouseIds);
      if (error) throw new Error(error.message);
    }

    if (backup.customers.length) {
      const { error } = await db
        .from("customers")
        .update({ company_id: transferId })
        .eq("company_id", input.unit_id);
      if (error) throw new Error(error.message);
    }

    if (backup.quotations.length) {
      const { error } = await db
        .from("quotations")
        .update({ company_id: transferId })
        .eq("company_id", input.unit_id);
      if (error) throw new Error(error.message);
    }

    if (backup.sales_orders.length) {
      const { error } = await db
        .from("sales_orders")
        .update({ company_id: transferId })
        .eq("company_id", input.unit_id);
      if (error) throw new Error(error.message);
    }

    if (backup.tax_invoices.length) {
      const { error } = await db
        .from("tax_invoices")
        .update({ company_id: transferId })
        .eq("company_id", input.unit_id);
      if (error) throw new Error(error.message);
    }

    const { data: sourceFlags } = await db
      .from("feature_flags")
      .select("flag_key, enabled")
      .eq("company_id", input.unit_id);

    const { data: targetFlags } = await db
      .from("feature_flags")
      .select("flag_key")
      .eq("company_id", transferId);

    const targetKeys = new Set((targetFlags ?? []).map((f) => f.flag_key));
    const flagsToInsert = (sourceFlags ?? [])
      .filter((f) => !targetKeys.has(f.flag_key))
      .map((f) => ({
        company_id: transferId,
        flag_key: f.flag_key,
        enabled: f.enabled,
      }));

    if (flagsToInsert.length) {
      await db.from("feature_flags").insert(flagsToInsert);
    }

    const { data: usersOnDeleted } = await db
      .from("user_companies")
      .select("user_id")
      .eq("company_id", input.unit_id);

    for (const row of usersOnDeleted ?? []) {
      await db.from("user_companies").upsert(
        { user_id: row.user_id, company_id: transferId },
        { onConflict: "user_id,company_id" }
      );
    }
  }

  await db.from("feature_flags").delete().eq("company_id", input.unit_id);
  await db.from("user_companies").delete().eq("company_id", input.unit_id);

  const { error: deleteError } = await db.from("companies").delete().eq("id", input.unit_id);
  if (deleteError) throw new Error(deleteError.message);

  await db.from("org_unit_deletion_backups").insert({
    organization_id: unit.organization_id,
    deleted_unit_id: input.unit_id,
    deleted_unit_name: unit.name,
    transferred_to_unit_id: input.transfer_to_unit_id ?? null,
    backup,
    deleted_by: userId,
  });

  return { backup, organization_id: unit.organization_id };
}

export async function createBranch(
  db: Db,
  userId: string,
  input: {
    company_id: string;
    name: string;
    code: string;
    trade_license_no: string;
    address?: string;
    is_head_office?: boolean;
  }
) {
  const { data: company } = await db
    .from("companies")
    .select("organization_id")
    .eq("id", input.company_id)
    .single();

  if (!company?.organization_id) throw new Error("Department not found");

  await assertOrgAccess(db, userId, company.organization_id);

  const branchId = randomUUID();
  const { error } = await db.from("branches").insert({
    id: branchId,
    company_id: input.company_id,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    trade_license_no: input.trade_license_no.trim(),
    address: input.address?.trim() ?? "",
    is_head_office: input.is_head_office ?? false,
  });

  if (error) throw new Error(error.message);

  await db.from("user_branches").insert({ user_id: userId, branch_id: branchId });

  return branchId;
}

export async function createWarehouse(
  db: Db,
  userId: string,
  input: {
    company_id: string;
    name: string;
    code: string;
    trade_license_no: string;
    address?: string;
  }
) {
  const { data: company } = await db
    .from("companies")
    .select("organization_id")
    .eq("id", input.company_id)
    .single();

  if (!company?.organization_id) throw new Error("Department not found");

  await assertOrgAccess(db, userId, company.organization_id);

  const warehouseId = randomUUID();
  const { error } = await db.from("warehouses").insert({
    id: warehouseId,
    company_id: input.company_id,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    trade_license_no: input.trade_license_no.trim(),
    address: input.address?.trim() ?? "",
  });

  if (error) throw new Error(error.message);

  await db.from("user_warehouses").insert({ user_id: userId, warehouse_id: warehouseId });

  return warehouseId;
}
