import type { BusinessLine, UnitType } from "@/lib/types";
import type { SessionPayload } from "@/lib/server/users";

export interface OrgStructureUnit {
  id: string;
  organization_id: string;
  unit_type: UnitType;
  name: string;
  trade_license_no: string;
  currency: string;
  address: string;
  vat_trn: string;
  fiscal_year_start: string;
  business_lines: BusinessLine[];
  branches: {
    id: string;
    company_id: string;
    name: string;
    code: string;
    address: string;
    trade_license_no: string;
    is_head_office: boolean;
  }[];
  warehouses: {
    id: string;
    company_id: string;
    name: string;
    code: string;
    address: string;
    trade_license_no: string;
  }[];
}

export interface OrgStructure {
  organization: {
    id: string;
    name: string;
    trade_license_no: string;
    address: string;
    currency: string;
    vat_trn: string;
  };
  units: OrgStructureUnit[];
}

export async function fetchOrgStructure(organizationId: string): Promise<OrgStructure | null> {
  const res = await fetch(`/api/admin/org-structure?organizationId=${organizationId}`);
  if (!res.ok) return null;
  return (await res.json()) as OrgStructure;
}

export async function createOrgResource(
  payload: Record<string, unknown>
): Promise<{ data?: OrgStructure & { session?: SessionPayload }; error?: string }> {
  const res = await fetch("/api/admin/org-structure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as OrgStructure & { session?: SessionPayload; error?: string };
  if (!res.ok) return { error: json.error ?? "Failed to create" };
  return { data: json };
}

export async function updateOrgResource(
  payload: Record<string, unknown>
): Promise<{ data?: OrgStructure; error?: string }> {
  const res = await fetch("/api/admin/org-structure", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as OrgStructure & { error?: string };
  if (!res.ok) return { error: json.error ?? "Failed to update" };
  return { data: json };
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

export async function fetchUnitBackup(
  unitId: string
): Promise<{ data?: UnitDeletionBackup; error?: string }> {
  const res = await fetch(`/api/admin/org-structure?backupUnitId=${unitId}`);
  const json = (await res.json()) as UnitDeletionBackup & { error?: string };
  if (!res.ok) return { error: json.error ?? "Failed to export backup" };
  return { data: json };
}

export async function deleteDepartmentUnit(payload: {
  unit_id: string;
  confirm_name: string;
  transfer_to_unit_id?: string;
}): Promise<{
  data?: OrgStructure & { session?: SessionPayload; backup?: UnitDeletionBackup };
  error?: string;
}> {
  const res = await fetch("/api/admin/org-structure", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as OrgStructure & {
    session?: SessionPayload;
    backup?: UnitDeletionBackup;
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? "Failed to delete department" };
  return { data: json };
}

export function downloadBackupFile(unitName: string, backup: UnitDeletionBackup) {
  const slug = unitName.replace(/[^\w.-]+/g, "_").slice(0, 48);
  const stamp = backup.exported_at.slice(0, 19).replace(/[:T]/g, "-");
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `department-backup-${slug}-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
