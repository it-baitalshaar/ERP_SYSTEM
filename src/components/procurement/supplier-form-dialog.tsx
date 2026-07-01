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
import { FieldLabel } from "@/components/i18n/field-label";
import { BilingualText } from "@/components/i18n/field-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/hooks/use-translations";
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
  const { t } = useTranslations();
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
      toast.error(t("common.supplierNameRequired"));
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

    toast.success(
      supplier
        ? t("procurement.pages.suppliers.updated")
        : t("procurement.pages.suppliers.created")
    );
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? (
              <BilingualText labelKey="procurement.pages.suppliers.edit" />
            ) : (
              <BilingualText labelKey="procurement.pages.suppliers.new" />
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="sup-name" labelKey="procurement.fields.name" />
            <Input
              id="sup-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="sup-email" labelKey="procurement.fields.email" />
              <Input
                id="sup-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="sup-phone" labelKey="procurement.fields.phone" />
              <Input
                id="sup-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel labelKey="procurement.fields.classification" />
              <Select
                value={form.classification}
                onValueChange={(v) => setForm({ ...form, classification: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">{t("procurement.fields.local")}</SelectItem>
                  <SelectItem value="import">{t("procurement.fields.import")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="sup-credit-days" labelKey="procurement.fields.creditDays" />
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
            <FieldLabel htmlFor="sup-terms" labelKey="procurement.fields.paymentTerms" />
            <Input
              id="sup-terms"
              value={form.payment_terms}
              onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">
                <BilingualText labelKey="procurement.fields.blockedSwitch" />
              </p>
              <p className="text-xs text-muted-foreground">
                <BilingualText labelKey="procurement.fields.blockedHint" />
              </p>
            </div>
            <Switch
              checked={form.is_blocked}
              onCheckedChange={(checked) => setForm({ ...form, is_blocked: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
