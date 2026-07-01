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
import { Switch } from "@/components/ui/switch";
import { fetchInvoiceFulfillment, salesAction } from "@/lib/data/sales";
import type { LineFulfillment } from "@/lib/sales/delivery-fulfillment";
import type { TaxInvoice } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { CUSTOMER_PRODUCT_BLOCKS_FLAG } from "@/lib/sales/customer-blocks";
import { toast } from "sonner";

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: TaxInvoice;
  companyId: string;
  warehouseId?: string;
  onSaved: () => void;
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  invoice,
  companyId,
  warehouseId,
  onSaved,
}: PartialPaymentDialogProps) {
  const blocksEnabled = useAppStore((s) => s.isFeatureEnabled(CUSTOMER_PRODUCT_BLOCKS_FLAG));
  const [fulfillment, setFulfillment] = useState<LineFulfillment[]>([]);
  const [payQty, setPayQty] = useState<Record<string, number>>({});
  const [createBlocks, setCreateBlocks] = useState(true);
  const [blockedUntil, setBlockedUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetchInvoiceFulfillment(companyId, invoice.id).then((rows) => {
      setFulfillment(rows);
      const initial: Record<string, number> = {};
      for (const row of rows) {
        const remaining = row.invoiced_qty - row.paid_qty;
        if (remaining > 0) initial[row.item_id] = 0;
      }
      setPayQty(initial);
    });
    const defaultUntil = new Date();
    defaultUntil.setDate(defaultUntil.getDate() + 14);
    setBlockedUntil(defaultUntil.toISOString().slice(0, 16));
  }, [open, companyId, invoice.id]);

  const handleSave = async () => {
    const paid_lines = fulfillment
      .filter((f) => (payQty[f.item_id] ?? 0) > 0)
      .map((f) => ({ item_id: f.item_id, qty_paid: payQty[f.item_id] ?? 0 }));

    if (!paid_lines.length) {
      toast.error("Enter paid quantity for at least one line");
      return;
    }

    setSaving(true);
    const result = await salesAction<TaxInvoice>(
      "invoices",
      companyId,
      invoice.id,
      "record_partial_payment",
      {
        paid_lines,
        create_blocks: blocksEnabled && createBlocks,
        blocked_until: blocksEnabled && createBlocks ? new Date(blockedUntil).toISOString() : undefined,
        warehouse_id: warehouseId,
      }
    );
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      blocksEnabled && createBlocks
        ? "Payment recorded — undelivered qty reserved for customer"
        : "Partial payment recorded"
    );
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record partial payment — {invoice.number}</DialogTitle>
        </DialogHeader>
        <div className="max-h-48 space-y-3 overflow-y-auto">
          {fulfillment.map((row) => (
            <div key={row.item_id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{row.item_name}</p>
              <p className="text-xs text-muted-foreground">
                Invoiced {row.invoiced_qty} · Already paid {row.paid_qty}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Label className="text-xs shrink-0">Pay qty now</Label>
                <Input
                  type="number"
                  min={0}
                  max={row.invoiced_qty - row.paid_qty}
                  step="any"
                  value={payQty[row.item_id] ?? 0}
                  onChange={(e) =>
                    setPayQty((prev) => ({
                      ...prev,
                      [row.item_id]: Number(e.target.value),
                    }))
                  }
                  className="h-8"
                />
              </div>
            </div>
          ))}
        </div>

        {blocksEnabled && (
          <div className="space-y-3 rounded-md border border-dashed p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-blocks">Reserve undelivered for customer</Label>
              <Switch
                id="create-blocks"
                checked={createBlocks}
                onCheckedChange={setCreateBlocks}
              />
            </div>
            {createBlocks && (
              <div className="space-y-1">
                <Label htmlFor="blocked-until" className="text-xs">
                  Hold until
                </Label>
                <Input
                  id="blocked-until"
                  type="datetime-local"
                  value={blockedUntil}
                  onChange={(e) => setBlockedUntil(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
