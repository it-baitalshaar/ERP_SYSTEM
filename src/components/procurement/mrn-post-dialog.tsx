"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { procurementAction } from "@/lib/data/procurement";
import { detectPriceVariance } from "@/lib/procurement/mrn-variance";
import type { LineItem, MaterialReceiptNote, PriceUpdateLine } from "@/lib/types";
import { isAdminRole } from "@/lib/permissions";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

interface MrnPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  mrn: MaterialReceiptNote | null;
  lpoLines?: LineItem[];
  onPosted: () => void;
}

export function MrnPostDialog({
  open,
  onOpenChange,
  companyId,
  mrn,
  lpoLines = [],
  onPosted,
}: MrnPostDialogProps) {
  const roleId = useAppStore((s) => s.currentUser?.role_id ?? "");
  const isAdmin = isAdminRole(roleId);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdateLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mrn) setPriceUpdates(mrn.price_updates ?? []);
  }, [mrn, open]);

  const variances = detectPriceVariance(lpoLines.length ? lpoLines : mrn?.lines ?? [], priceUpdates);
  const hasVariance = variances.length > 0;

  const postMrn = async (approveLpoUpdate: boolean) => {
    if (!mrn) return;
    setSaving(true);
    const result = await procurementAction<MaterialReceiptNote>(
      "material_receipt_notes",
      companyId,
      mrn.id,
      "post",
      {
        price_updates: priceUpdates,
        ...(approveLpoUpdate ? { approve_lpo_price_update: true } : {}),
      }
    );
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      approveLpoUpdate
        ? "MRN posted — LPO prices updated, stock and item costs refreshed"
        : "MRN posted — stock increased"
    );
    onPosted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post MRN {mrn?.number}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Enter received (purchase) cost and selling price per item. If received cost differs from
          the LPO, an admin must approve and update the LPO before posting.
        </p>

        {hasVariance && (
          <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">LPO price mismatch</p>
              <p>
                {isAdmin
                  ? "Approve below to update LPO line prices to match received cost, then post."
                  : "Only a Company Admin or Super Admin can approve and update the LPO."}
              </p>
            </div>
          </div>
        )}

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {priceUpdates.map((row, index) => (
            <div key={row.item_id} className="grid gap-2 rounded-md border p-3 text-sm">
              <div className="font-medium">{row.item_name}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">LPO price</Label>
                  <p>AED {row.old_unit_price}</p>
                </div>
                <div>
                  <Label className="text-xs">Received cost</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={row.new_unit_price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPriceUpdates((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, new_unit_price: val } : p))
                      );
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Sale price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={row.new_sale_price ?? row.new_unit_price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPriceUpdates((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, new_sale_price: val } : p))
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!hasVariance && (
            <Button onClick={() => void postMrn(false)} disabled={saving || !mrn}>
              {saving ? "Posting…" : "Post MRN"}
            </Button>
          )}
          {hasVariance && isAdmin && (
            <Button onClick={() => void postMrn(true)} disabled={saving || !mrn}>
              {saving ? "Posting…" : "Approve LPO update & post"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
