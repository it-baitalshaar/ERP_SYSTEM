import type { OrgDataBackupV1, OrgDataScope } from "@/lib/org-data-backup";
import { backupSummary, normalizeOrgDataBackup } from "@/lib/org-data-backup";
import type { SessionPayload } from "@/lib/server/users";
import type { OrgStructure } from "@/lib/data/org-structure";

export type { OrgDataBackupV1, OrgDataScope };

export async function exportOrgDataBackup(
  scope: OrgDataScope,
  entityId: string
): Promise<{ data?: OrgDataBackupV1; error?: string }> {
  const res = await fetch("/api/admin/org-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "export", scope, entity_id: entityId }),
  });
  const json = (await res.json()) as { backup?: OrgDataBackupV1; error?: string };
  if (!res.ok) return { error: json.error ?? "Export failed" };
  return { data: json.backup };
}

export async function resetOrgDataScope(payload: {
  scope: OrgDataScope;
  entity_id: string;
  confirm_name: string;
}): Promise<{
  data?: OrgStructure & { session?: SessionPayload; backup?: OrgDataBackupV1 };
  error?: string;
}> {
  const res = await fetch("/api/admin/org-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset", ...payload }),
  });
  const json = (await res.json()) as OrgStructure & {
    session?: SessionPayload;
    backup?: OrgDataBackupV1;
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? "Reset failed" };
  return { data: json };
}

export async function restoreOrgDataBackup(payload: {
  target_id: string;
  confirm_name: string;
  backup: OrgDataBackupV1;
}): Promise<{
  data?: OrgStructure & { session?: SessionPayload; backup?: OrgDataBackupV1 };
  error?: string;
}> {
  const res = await fetch("/api/admin/org-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "restore", ...payload }),
  });
  const json = (await res.json()) as OrgStructure & {
    session?: SessionPayload;
    backup?: OrgDataBackupV1;
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? "Restore failed" };
  return { data: json };
}

export async function deleteBranchEntity(payload: {
  entity_id: string;
  confirm_name: string;
  transfer_to_branch_id?: string;
}): Promise<{
  data?: OrgStructure & { session?: SessionPayload; backup?: OrgDataBackupV1 };
  error?: string;
}> {
  const res = await fetch("/api/admin/org-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "delete",
      scope: "branch",
      ...payload,
    }),
  });
  const json = (await res.json()) as OrgStructure & {
    session?: SessionPayload;
    backup?: OrgDataBackupV1;
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? "Failed to delete branch" };
  return { data: json };
}

export function downloadOrgDataBackupFile(label: string, backup: OrgDataBackupV1) {
  const slug = label.replace(/[^\w.-]+/g, "_").slice(0, 48);
  const stamp = backup.exported_at.slice(0, 19).replace(/[:T]/g, "-");
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `erp-backup-${backup.scope}-${slug}-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<OrgDataBackupV1> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        resolve(normalizeOrgDataBackup(parsed));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Invalid backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export { backupSummary, normalizeOrgDataBackup };
