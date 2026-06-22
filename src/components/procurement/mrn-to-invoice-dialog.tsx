"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThreeWayMatchPanel } from "@/components/procurement/three-way-match-panel";
import {
  createSupplierInvoiceFromMrn,
  fetchMrnInvoicePreview,
} from "@/lib/data/procurement";
import type { ThreeWayMatchResult } from "@/lib/procurement/three-way-match";
import type { MaterialReceiptNote, PurchaseOrder } from "@/lib/types";
import { toast } from "sonner";

interface MrnToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  branchId: string;
  mrn: MaterialReceiptNote | null;
  onCreated: () => void;
}

interface PreviewData {
  mrn: MaterialReceiptNote;
  po: PurchaseOrder;
  match: ThreeWayMatchResult;
  existing_invoice: { id: string; number: string } | null;
}

export function MrnToInvoiceDialog({
  open,
  onOpenChange,
  companyId,
  branchId,
  mrn,
  onCreated,
}: MrnToInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (!open || !mrn) {
      setPreview(null);
      return;
    }

    setLoading(true);
    void fetchMrnInvoicePreview(companyId, mrn.id).then((result) => {
      setLoading(false);
      if (result.error) {
        toast.error(result.error);
        onOpenChange(false);
        return;
      }
      setPreview(result.data as PreviewData);
    });
  }, [open, mrn, companyId, onOpenChange]);

  const handleCreate = async () => {
    if (!mrn) return;
    if (!branchId) {
      toast.error("Select a branch in the top bar");
      return;
    }

    setCreating(true);
    const result = await createSupplierInvoiceFromMrn(companyId, branchId, mrn.id);
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Supplier invoice ${result.data?.number ?? ""} created from MRN`);
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier invoice from MRN</DialogTitle>
          <DialogDescription>
            {mrn?.number} — lines and prices from posted receipt (LPO prices for 3-way match)
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading preview…</p>}

        {preview?.existing_invoice && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            This MRN already has supplier invoice{" "}
            <strong>{preview.existing_invoice.number}</strong>.{" "}
            <Link
              href="/procurement/supplier-invoices"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Open supplier invoices
            </Link>
          </div>
        )}

        {preview?.match && !preview.existing_invoice && (
          <ThreeWayMatchPanel match={preview.match} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!preview?.existing_invoice && (
            <Button
              disabled={creating || loading || !preview?.match.matched}
              onClick={() => void handleCreate()}
            >
              {creating ? "Creating…" : "Create supplier invoice"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
