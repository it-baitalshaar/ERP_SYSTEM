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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createSupplier, updateSupplier } from "@/lib/data/procurement";
import type { Supplier } from "@/lib/types";
import { toast } from "sonner";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  supplier?: Supplier | null;
  onSaved: () => void;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  payment_terms: "Net 30",
  classification: "local",
  currency: "AED",
  credit_days: 30,
  is_blocked: false,
};

export function SupplierFormDialog({
  open,
  onOpenChange,
  companyId,
  supplier,
  onSaved,
}: SupplierFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        payment_terms: supplier.payment_terms,
        classification: supplier.classification,
        currency: supplier.currency,
        credit_days: supplier.credit_days,
        is_blocked: supplier.is_blocked,
      });
    } else {
      setForm(emptyForm);
    }
  }, [supplier, open]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSaving(true);
    const result = supplier
      ? await updateSupplier(companyId, supplier.id, form)
      : await createSupplier(companyId, form);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(supplier ? "Supplier updated" : "Supplier created");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sup-name">Name</Label>
            <Input
              id="sup-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-email">Email</Label>
              <Input
                id="sup-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-phone">Phone</Label>
              <Input
                id="sup-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select
                value={form.classification}
                onValueChange={(v) => setForm({ ...form, classification: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-credit-days">Credit days</Label>
              <Input
                id="sup-credit-days"
                type="number"
                min={0}
                value={form.credit_days}
                onChange={(e) =>
                  setForm({ ...form, credit_days: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sup-terms">Payment terms</Label>
            <Input
              id="sup-terms"
              value={form.payment_terms}
              onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Blocked</p>
              <p className="text-xs text-muted-foreground">Prevent new purchase documents</p>
            </div>
            <Switch
              checked={form.is_blocked}
              onCheckedChange={(checked) => setForm({ ...form, is_blocked: checked })}
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
