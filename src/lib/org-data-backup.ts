export type OrgDataScope = "unit" | "branch" | "warehouse";

/** Versioned backup format for export, reset archives, and restore. */
export interface OrgDataBackupV1 {
  version: 1;
  scope: OrgDataScope;
  exported_at: string;
  organization_id: string;
  label: string;
  unit?: Record<string, unknown>;
  branches?: Record<string, unknown>[];
  warehouses?: Record<string, unknown>[];
  customers?: Record<string, unknown>[];
  quotations?: Record<string, unknown>[];
  sales_orders?: Record<string, unknown>[];
  tax_invoices?: Record<string, unknown>[];
  feature_flags?: Record<string, unknown>[];
  branch?: Record<string, unknown>;
  warehouse?: Record<string, unknown>;
}

export function isOrgDataBackupV1(value: unknown): value is OrgDataBackupV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as OrgDataBackupV1;
  return v.version === 1 && ["unit", "branch", "warehouse"].includes(v.scope);
}

/** Accept legacy department-deletion exports (no version/scope). */
export function normalizeOrgDataBackup(raw: unknown): OrgDataBackupV1 {
  if (isOrgDataBackupV1(raw)) return raw;

  const legacy = raw as {
    exported_at?: string;
    organization_id?: string;
    unit?: Record<string, unknown>;
    branches?: Record<string, unknown>[];
    warehouses?: Record<string, unknown>[];
    customers?: Record<string, unknown>[];
    quotations?: Record<string, unknown>[];
    sales_orders?: Record<string, unknown>[];
    tax_invoices?: Record<string, unknown>[];
    feature_flags?: Record<string, unknown>[];
    branch?: Record<string, unknown>;
    warehouse?: Record<string, unknown>;
  };

  if (legacy.branch && legacy.organization_id) {
    return {
      version: 1,
      scope: "branch",
      exported_at: legacy.exported_at ?? new Date().toISOString(),
      organization_id: legacy.organization_id,
      label: `${legacy.branch.code ?? ""} — ${legacy.branch.name ?? "Branch"}`.trim(),
      branch: legacy.branch,
      quotations: legacy.quotations ?? [],
      sales_orders: legacy.sales_orders ?? [],
      tax_invoices: legacy.tax_invoices ?? [],
    };
  }

  if (legacy.warehouse && legacy.organization_id) {
    return {
      version: 1,
      scope: "warehouse",
      exported_at: legacy.exported_at ?? new Date().toISOString(),
      organization_id: legacy.organization_id,
      label: `${legacy.warehouse.code ?? ""} — ${legacy.warehouse.name ?? "Warehouse"}`.trim(),
      warehouse: legacy.warehouse,
    };
  }

  if (legacy.unit && legacy.organization_id) {
    const unitName = String(legacy.unit.name ?? "Unit");
    return {
      version: 1,
      scope: "unit",
      exported_at: legacy.exported_at ?? new Date().toISOString(),
      organization_id: legacy.organization_id,
      label: unitName,
      unit: legacy.unit,
      branches: legacy.branches ?? [],
      warehouses: legacy.warehouses ?? [],
      customers: legacy.customers ?? [],
      quotations: legacy.quotations ?? [],
      sales_orders: legacy.sales_orders ?? [],
      tax_invoices: legacy.tax_invoices ?? [],
      feature_flags: legacy.feature_flags ?? [],
    };
  }

  throw new Error("Unrecognized backup file format");
}

export function backupSummary(backup: OrgDataBackupV1): string {
  if (backup.scope === "unit") {
    return [
      `${backup.customers?.length ?? 0} customers`,
      `${backup.quotations?.length ?? 0} quotations`,
      `${backup.sales_orders?.length ?? 0} sales orders`,
      `${backup.tax_invoices?.length ?? 0} invoices`,
      `${backup.branches?.length ?? 0} branches (structure)`,
      `${backup.warehouses?.length ?? 0} warehouses (structure)`,
    ].join(" · ");
  }
  if (backup.scope === "branch") {
    return [
      `${backup.quotations?.length ?? 0} quotations`,
      `${backup.sales_orders?.length ?? 0} sales orders`,
      `${backup.tax_invoices?.length ?? 0} invoices`,
    ].join(" · ");
  }
  return "Warehouse profile and settings";
}

export function scopeLabel(scope: OrgDataScope): string {
  if (scope === "unit") return "Shop / department";
  if (scope === "branch") return "Branch";
  return "Warehouse";
}
