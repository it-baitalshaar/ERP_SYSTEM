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
import { createItem, updateItem } from "@/lib/data/inventory";
import type { Item } from "@/lib/types";
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
  unit_price: 0,
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
      setForm({
        sku: item.sku,
        name: item.name,
        base_uom: item.base_uom,
        reorder_level: item.reorder_level,
        unit_price: item.unit_price,
        is_batch_managed: item.is_batch_managed,
      });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU and name are required");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      category_id: "",
      uom_conversions: [{ uom: form.base_uom, factor: 1 }],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
              <Label htmlFor="item-uom">Base UOM</Label>
              <Input
                id="item-uom"
                value={form.base_uom}
                onChange={(e) => setForm({ ...form, base_uom: e.target.value })}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-price">Unit price (AED)</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              />
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
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Batch managed</p>
              <p className="text-xs text-muted-foreground">Ceramic tiles, lots, etc.</p>
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
