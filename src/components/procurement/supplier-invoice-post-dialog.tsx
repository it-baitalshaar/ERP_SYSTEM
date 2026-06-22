"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ThreeWayMatchPanel } from "@/components/procurement/three-way-match-panel";
import { fetchThreeWayMatch, procurementAction } from "@/lib/data/procurement";
import type { ThreeWayMatchResult } from "@/lib/procurement/three-way-match";
import type { SupplierInvoice } from "@/lib/types";
import { isAdminRole } from "@/lib/permissions";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

interface SupplierInvoicePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  invoice: SupplierInvoice | null;
  onPosted: () => void;
}

export function SupplierInvoicePostDialog({
  open,
  onOpenChange,
  companyId,
  invoice,
  onPosted,
}: SupplierInvoicePostDialogProps) {
  const roleId = useAppStore((s) => s.currentUser?.role_id ?? "");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [match, setMatch] = useState<ThreeWayMatchResult | null>(null);
  const [allowVariance, setAllowVariance] = useState(false);

  useEffect(() => {
    if (!open || !invoice) {
      setMatch(null);
      setAllowVariance(false);
      return;
    }

    if (!invoice.mrn_id) {
      setMatch(null);
      return;
    }

    setLoading(true);
    void fetchThreeWayMatch(companyId, { supplierInvoiceId: invoice.id }).then((result) => {
      setLoading(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setMatch(result.data ?? null);
    });
  }, [open, invoice, companyId]);

  const handlePost = async () => {
    if (!invoice) return;

    setPosting(true);
    const result = await procurementAction<SupplierInvoice>(
      "supplier_invoices",
      companyId,
      invoice.id,
      "post",
      invoice.mrn_id && allowVariance ? { allow_variance: true } : undefined
    );
    setPosting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Supplier invoice posted");
    onPosted();
    onOpenChange(false);
  };

  const canPost =
    !invoice?.mrn_id || (match?.matched ?? false) || (allowVariance && isAdminRole(roleId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post supplier invoice</DialogTitle>
          <DialogDescription>
            {invoice?.number}
            {invoice?.mrn_id
              ? " — 3-way match vs LPO and MRN required before posting"
              : " — no MRN link; posting without 3-way match"}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading 3-way match…</p>}

        {invoice?.mrn_id && match && <ThreeWayMatchPanel match={match} />}

        {invoice?.mrn_id && match && !match.matched && isAdminRole(roleId) && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <input
              id="allow-variance"
              type="checkbox"
              checked={allowVariance}
              onChange={(e) => setAllowVariance(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="allow-variance" className="cursor-pointer font-normal">
              Post with variances (admin override)
            </Label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={posting || loading || !canPost} onClick={() => void handlePost()}>
            {posting ? "Posting…" : "Post invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
