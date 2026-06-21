"use client";

import { useEffect, useState } from "react";
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
import type { MaterialReceiptNote, PriceUpdateLine } from "@/lib/types";
import { toast } from "sonner";

interface MrnPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  mrn: MaterialReceiptNote | null;
  onPosted: () => void;
}

export function MrnPostDialog({
  open,
  onOpenChange,
  companyId,
  mrn,
  onPosted,
}: MrnPostDialogProps) {
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdateLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mrn) setPriceUpdates(mrn.price_updates ?? []);
  }, [mrn, open]);

  const handlePost = async () => {
    if (!mrn) return;
    setSaving(true);
    const result = await procurementAction<MaterialReceiptNote>(
      "material_receipt_notes",
      companyId,
      mrn.id,
      "post",
      { price_updates: priceUpdates }
    );
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("MRN posted — stock increased and prices updated");
    onPosted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post MRN {mrn?.number}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirm received prices. Posting adds stock to the warehouse and updates item costs where
          changed.
        </p>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {priceUpdates.map((row, index) => (
            <div key={row.item_id} className="grid grid-cols-3 gap-2 rounded-md border p-3 text-sm">
              <div className="col-span-3 font-medium">{row.item_name}</div>
              <div>
                <Label className="text-xs">PO price</Label>
                <p>AED {row.old_unit_price}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Received price</Label>
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
            </div>
          ))}
          {priceUpdates.length === 0 && (
            <p className="text-sm text-muted-foreground">No line items on this MRN.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handlePost()} disabled={saving || !mrn}>
            {saving ? "Posting…" : "Post MRN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
