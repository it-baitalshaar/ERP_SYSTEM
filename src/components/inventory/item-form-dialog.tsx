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
import { UomSelect } from "@/components/inventory/uom-select";
import { createItem, updateItem } from "@/lib/data/inventory";
import { UOM_SUBUNIT_HINTS } from "@/lib/inventory/uom";
import type { Item, UomConversion } from "@/lib/types";
import { toast } from "sonner";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  item?: Item | null;
  onSaved: () => void;
}

const emptyForm = {
  sku: "",
  name: "",
  base_uom: "pcs",
  reorder_level: 0,
  cost_price: 0,
  unit_price: 0,
  subunit_factor: 1,
  is_batch_managed: false,
};

export function ItemFormDialog({
  open,
  onOpenChange,
  companyId,
  item,
  onSaved,
}: ItemFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const extra = item.uom_conversions?.find((c) => c.uom !== item.base_uom);
      setForm({
        sku: item.sku,
        name: item.name,
        base_uom: item.base_uom,
        reorder_level: item.reorder_level,
        cost_price: item.cost_price ?? 0,
        unit_price: item.unit_price,
        subunit_factor: extra?.factor ?? UOM_SUBUNIT_HINTS[item.base_uom]?.defaultFactor ?? 1,
        is_batch_managed: item.is_batch_managed,
      });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const buildConversions = (): UomConversion[] => {
    const hint = UOM_SUBUNIT_HINTS[form.base_uom];
    if (!hint || hint.subUom === form.base_uom) {
      return [{ uom: form.base_uom, factor: 1 }];
    }
    return [
      { uom: form.base_uom, factor: 1 },
      { uom: hint.subUom, factor: form.subunit_factor },
    ];
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU and name are required");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      category_id: "",
      uom_conversions: buildConversions(),
    };
    const result = item
      ? await updateItem(companyId, item.id, payload)
      : await createItem(companyId, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(item ? "Item updated" : "Item created");
    onSaved();
    onOpenChange(false);
  };

  const subHint = UOM_SUBUNIT_HINTS[form.base_uom];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "New item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-sku">SKU</Label>
              <Input
                id="item-sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Base UOM</Label>
              <UomSelect
                value={form.base_uom}
                onValueChange={(base_uom) =>
                  setForm({
                    ...form,
                    base_uom,
                    subunit_factor: UOM_SUBUNIT_HINTS[base_uom]?.defaultFactor ?? 1,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          {subHint && subHint.subUom !== form.base_uom && (
            <div className="space-y-2 rounded-md border p-3">
              <Label>{subHint.label}</Label>
              <Input
                type="number"
                min={0.001}
                step="any"
                value={form.subunit_factor}
                onChange={(e) => setForm({ ...form, subunit_factor: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                1 {form.base_uom} = {form.subunit_factor} {subHint.subUom}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-cost">Cost price (buy)</Label>
              <Input
                id="item-cost"
                type="number"
                min={0}
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Sale price (sell)</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-reorder">Reorder level</Label>
            <Input
              id="item-reorder"
              type="number"
              min={0}
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Batch managed</p>
              <p className="text-xs text-muted-foreground">Tiles, lots, etc.</p>
            </div>
            <Switch
              checked={form.is_batch_managed}
              onCheckedChange={(checked) => setForm({ ...form, is_batch_managed: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
