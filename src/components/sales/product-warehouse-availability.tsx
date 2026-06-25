"use client";

import { useState } from "react";
import { Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatAvailabilitySummary,
  formatQty,
  type WarehouseAvailability,
} from "@/lib/sales/warehouse-availability";

interface ProductWarehouseAvailabilityProps {
  itemId: string;
  itemName?: string;
  uom?: string;
  warehouses: WarehouseAvailability[];
}

export function ProductWarehouseAvailability({
  itemId,
  itemName,
  uom,
  warehouses,
}: ProductWarehouseAvailabilityProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  if (!itemId) return null;

  const summary = formatAvailabilitySummary(warehouses);
  const hasStock = warehouses.some((w) => w.qty_available > 0);

  return (
    <>
      <div className="flex items-start gap-1.5 rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-2 py-1.5">
        <Warehouse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs ${hasStock ? "text-foreground" : "text-amber-700 dark:text-amber-300"}`}
          >
            {summary}
            {uom ? ` ${uom}` : ""}
          </p>
        </div>
        {warehouses.length > 0 && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto shrink-0 px-0 text-xs"
            onClick={() => setDetailOpen(true)}
          >
            Details
          </Button>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Warehouse availability</DialogTitle>
          </DialogHeader>
          {itemName && (
            <p className="text-sm text-muted-foreground">{itemName}</p>
          )}
          {warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock records for this product.</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Warehouse</th>
                    <th className="px-3 py-2 text-right font-medium">On hand</th>
                    <th className="px-3 py-2 text-right font-medium">Reserved</th>
                    <th className="px-3 py-2 text-right font-medium">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr key={w.warehouse_id} className="border-t">
                      <td className="px-3 py-2">
                        <span className="font-medium">{w.warehouse_code}</span>
                        <span className="block text-xs text-muted-foreground">
                          {w.warehouse_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatQty(w.qty_on_hand)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {formatQty(w.qty_reserved)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums font-medium ${
                          w.qty_available > 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatQty(w.qty_available)}
                        {uom ? ` ${uom}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
