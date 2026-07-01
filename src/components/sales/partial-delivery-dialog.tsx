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
import { fetchInvoiceFulfillment, salesAction } from "@/lib/data/sales";
import type { LineFulfillment } from "@/lib/sales/delivery-fulfillment";
import type { DeliveryNote, TaxInvoice } from "@/lib/types";
import { toast } from "sonner";

interface PartialDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: TaxInvoice;
  companyId: string;
  warehouseId?: string;
  onCreated: () => void;
}

export function PartialDeliveryDialog({
  open,
  onOpenChange,
  invoice,
  companyId,
  warehouseId,
  onCreated,
}: PartialDeliveryDialogProps) {
  const [fulfillment, setFulfillment] = useState<LineFulfillment[]>([]);
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetchInvoiceFulfillment(companyId, invoice.id).then((rows) => {
      setFulfillment(rows);
      const initial: Record<string, number> = {};
      for (const row of rows) {
        if (row.deliverable_qty > 0) initial[row.item_id] = row.deliverable_qty;
      }
      setQtyByItem(initial);
      setLoading(false);
    });
  }, [open, companyId, invoice.id]);

  const handleCreate = async () => {
    const lines = fulfillment
      .filter((f) => (qtyByItem[f.item_id] ?? 0) > 0)
      .map((f) => {
        const invLine = invoice.lines.find((l) => l.item_id === f.item_id);
        return {
          item_id: f.item_id,
          item_name: f.item_name,
          qty: qtyByItem[f.item_id] ?? 0,
          uom: invLine?.uom ?? "pcs",
          unit_price: invLine?.unit_price ?? 0,
          discount_pct: invLine?.discount_pct ?? 0,
          vat_pct: invLine?.vat_pct ?? 5,
        };
      });

    if (!lines.length) {
      toast.error("Enter quantity to deliver for at least one line");
      return;
    }

    setSaving(true);
    const result = await salesAction<DeliveryNote>(
      "invoices",
      companyId,
      invoice.id,
      "create_delivery_note",
      { warehouse_id: warehouseId, lines }
    );
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Partial delivery note created — post it to deduct stock");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Partial delivery — {invoice.number}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Deliver only paid / available qty. Invoice total: {invoice.lines.length} line(s).
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading fulfillment…</p>
        ) : (
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {fulfillment.map((row) => (
              <div key={row.item_id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{row.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  Invoiced {row.invoiced_qty} · Paid {row.paid_qty} · Delivered{" "}
                  {row.delivered_qty} · Available {row.deliverable_qty}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Label className="text-xs shrink-0">Deliver now</Label>
                  <Input
                    type="number"
                    min={0}
                    max={row.deliverable_qty}
                    step="any"
                    value={qtyByItem[row.item_id] ?? 0}
                    disabled={row.deliverable_qty <= 0}
                    onChange={(e) =>
                      setQtyByItem((prev) => ({
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={saving || loading}>
            {saving ? "Creating…" : "Create delivery note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
