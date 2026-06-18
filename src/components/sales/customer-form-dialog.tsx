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
import { createCustomer, updateCustomer } from "@/lib/data/sales";
import type { Customer } from "@/lib/types";
import { toast } from "sonner";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  customer?: Customer | null;
  onSaved: (customer: Customer) => void;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  classification: "retail" as Customer["classification"],
  credit_limit: 0,
  is_blocked: false,
};

export function CustomerFormDialog({
  open,
  onOpenChange,
  companyId,
  customer,
  onSaved,
}: CustomerFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        classification: customer.classification,
        credit_limit: customer.credit_limit,
        is_blocked: customer.is_blocked,
      });
    } else {
      setForm(emptyForm);
    }
  }, [customer, open]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    const result = customer
      ? await updateCustomer(companyId, customer.id, form)
      : await createCustomer(companyId, form);
    setSaving(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "Failed to save customer");
      return;
    }

    toast.success(customer ? "Customer updated" : "Customer created");
    onSaved(result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cust-name">Name</Label>
            <Input
              id="cust-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
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
                onValueChange={(v) =>
                  setForm({ ...form, classification: v as Customer["classification"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-credit">Credit limit (AED)</Label>
              <Input
                id="cust-credit"
                type="number"
                min={0}
                value={form.credit_limit}
                onChange={(e) =>
                  setForm({ ...form, credit_limit: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Blocked</p>
              <p className="text-xs text-muted-foreground">Prevent new sales documents</p>
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
