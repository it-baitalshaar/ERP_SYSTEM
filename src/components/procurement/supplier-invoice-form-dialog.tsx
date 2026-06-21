"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { documentTotal } from "@/lib/sales/calculations";
import { createSupplierInvoice } from "@/lib/data/procurement";
import { getProcurementCatalog } from "@/lib/procurement/catalog";
import type { Item, LineItem, Supplier } from "@/lib/types";
import { toast } from "sonner";

interface SupplierInvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  branchId: string;
  suppliers: Supplier[];
  onCreated: () => void;
}

const emptyLine = (): LineItem => ({
  item_id: "",
  item_name: "",
  qty: 1,
  uom: "pcs",
  unit_price: 0,
  discount_pct: 0,
  vat_pct: 5,
});

export function SupplierInvoiceFormDialog({
  open,
  onOpenChange,
  companyId,
  branchId,
  suppliers,
  onCreated,
}: SupplierInvoiceFormDialogProps) {
  const [catalog, setCatalog] = useState<Item[]>([]);
  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => !s.is_blocked),
    [suppliers]
  );

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) void getProcurementCatalog(companyId).then(setCatalog);
  }, [open, companyId]);

  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!justOpened) return;
    setSupplierId(activeSuppliers[0]?.id ?? "");
    setLines([emptyLine()]);
  }, [open, activeSuppliers]);

  const total = documentTotal(lines);

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const pickCatalogItem = (index: number, itemId: string) => {
    const item = catalog.find((c) => c.id === itemId);
    if (!item) return;
    updateLine(index, {
      item_id: item.id,
      item_name: item.name,
      uom: item.base_uom,
      unit_price: item.unit_price,
      vat_pct: 5,
    });
  };

  const handleSave = async () => {
    if (!branchId) {
      toast.error("Select a branch in the top bar");
      return;
    }
    if (!supplierId) {
      toast.error("Select a supplier");
      return;
    }

    setSaving(true);
    const result = await createSupplierInvoice({
      company_id: companyId,
      branch_id: branchId,
      supplier_id: supplierId,
      lines,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Supplier invoice created");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New supplier invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId || undefined} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {activeSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-1 h-3 w-3" />
                Add line
              </Button>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-6">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <Select
                    value={line.item_id ? line.item_id : undefined}
                    onValueChange={(id) => pickCatalogItem(index, id)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick from catalog" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.sku} — {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or type item name"
                    value={line.item_name}
                    onChange={(e) => updateLine(index, { item_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={line.qty}
                    onChange={(e) => updateLine(index, { qty: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={line.unit_price}
                    onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  {lines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end text-sm font-medium">
            Total (incl. VAT): AED {total.toLocaleString()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Creating…" : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
