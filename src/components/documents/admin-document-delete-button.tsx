"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeleteCheckResult, DocumentModule } from "@/lib/documents/delete-types";
import { isAdminRole } from "@/lib/permissions";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

interface AdminDocumentDeleteButtonProps {
  module: DocumentModule;
  resource: string;
  documentId: string;
  companyId: string;
  onDeleted: () => void;
  size?: "sm" | "default";
}

async function documentDeleteRequest(
  module: DocumentModule,
  resource: string,
  companyId: string,
  id: string,
  action: "check_delete" | "delete"
): Promise<{ data?: DeleteCheckResult; error?: string }> {
  const api = module === "procurement" ? "/api/procurement" : "/api/sales";
  const res = await fetch(api, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resource,
      company_id: companyId,
      id,
      action,
    }),
  });
  const json = (await res.json()) as { data?: DeleteCheckResult; error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json.data };
}

export function AdminDocumentDeleteButton({
  module,
  resource,
  documentId,
  companyId,
  onDeleted,
  size = "sm",
}: AdminDocumentDeleteButtonProps) {
  const roleId = useAppStore((s) => s.currentUser?.role_id ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [check, setCheck] = useState<DeleteCheckResult | null>(null);

  if (!isAdminRole(roleId)) return null;

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setCheck(null);
    const result = await documentDeleteRequest(
      module,
      resource,
      companyId,
      documentId,
      "check_delete"
    );
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      setOpen(false);
      return;
    }
    setCheck(result.data ?? null);
  };

  const confirmDelete = async () => {
    if (!check?.allowed) return;
    setDeleting(true);
    const result = await documentDeleteRequest(
      module,
      resource,
      companyId,
      documentId,
      "delete"
    );
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${check.document_number} deleted`);
    setOpen(false);
    onDeleted();
  };

  return (
    <>
      <Button
        size={size}
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => void openDialog()}
      >
        <Trash2 className="mr-1 h-3 w-3" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              {check
                ? `${check.document_number} (${check.document_status.replace(/_/g, " ")})`
                : "Checking linked documents…"}
            </DialogDescription>
          </DialogHeader>

          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {check && !check.allowed && (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-destructive">
                Cannot delete — remove linked documents first:
              </p>
              {check.delete_order_hint && (
                <p className="text-muted-foreground">
                  Suggested order: {check.delete_order_hint}
                </p>
              )}
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {check.blockers.map((b) => (
                  <li key={b.id}>
                    <span className="font-medium">
                      {b.kind} {b.number}
                    </span>
                    {b.status && (
                      <span className="text-muted-foreground"> — {b.status.replace(/_/g, " ")}</span>
                    )}
                    <p className="text-muted-foreground">{b.hint}</p>
                    <Link
                      href={b.href}
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Open {b.kind} list
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {check?.allowed && (
            <div className="space-y-2 text-sm">
              {check.warnings.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-amber-700 dark:text-amber-400">
                  {check.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <p>This action cannot be undone.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {check?.allowed && (
              <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? "Deleting…" : "Delete permanently"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
