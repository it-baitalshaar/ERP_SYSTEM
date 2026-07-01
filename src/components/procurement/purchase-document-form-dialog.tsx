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
import { FieldLabel, BilingualText } from "@/components/i18n/field-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/hooks/use-translations";
import { documentTotal } from "@/lib/sales/calculations";
import { createMaterialRequest, createPurchaseOrder } from "@/lib/data/procurement";
import { getProcurementCatalog } from "@/lib/procurement/catalog";
import type { Item, LineItem, PurchasePaymentTerms, Supplier } from "@/lib/types";
import { toast } from "sonner";

export type PurchaseDocumentKind = "material_request" | "lpo";

interface PurchaseDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: PurchaseDocumentKind;
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

export function PurchaseDocumentFormDialog({
  open,
  onOpenChange,
  kind,
  companyId,
  branchId,
  suppliers,
  onCreated,
}: PurchaseDocumentFormDialogProps) {
  const { t } = useTranslations();
  const [catalog, setCatalog] = useState<Item[]>([]);
  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => !s.is_blocked),
    [suppliers]
  );

  const [supplierId, setSupplierId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PurchasePaymentTerms>("credit");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const wasOpen = useRef(false);

  const kindTitleKey =
    kind === "material_request"
      ? "procurement.documents.newMaterialRequest"
      : "procurement.documents.newLpo";
  const kindCreatedKey =
    kind === "material_request"
      ? "procurement.documents.createdMaterialRequest"
      : "procurement.documents.createdLpo";
  const kindCreateKey =
    kind === "material_request"
      ? "procurement.documents.materialRequest"
      : "procurement.documents.lpo";

  useEffect(() => {
    if (open) void getProcurementCatalog(companyId).then(setCatalog);
  }, [open, companyId]);

  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!justOpened) return;

    setSupplierId(activeSuppliers[0]?.id ?? "");
    setPaymentTerms("credit");
    setNotes("");
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
      toast.error(t("common.selectBranchTopBar"));
      return;
    }
    if (kind === "lpo" && !supplierId) {
      toast.error(t("common.selectSupplier"));
      return;
    }

    setSaving(true);
    const result =
      kind === "material_request"
        ? await createMaterialRequest({
            company_id: companyId,
            branch_id: branchId,
            lines,
            notes: notes || undefined,
          })
        : await createPurchaseOrder({
            company_id: companyId,
            branch_id: branchId,
            supplier_id: supplierId,
            lines,
            payment_terms_type: paymentTerms,
            notes: notes || undefined,
          });

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(t(kindCreatedKey));
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <BilingualText labelKey={kindTitleKey} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {kind === "lpo" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel labelKey="procurement.fields.supplier" />
                <Select
                  value={supplierId || undefined}
                  onValueChange={setSupplierId}
                  disabled={activeSuppliers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("procurement.placeholders.selectSupplier")} />
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
              <div className="space-y-2">
                <FieldLabel labelKey="procurement.fields.paymentTiming" />
                <Select
                  value={paymentTerms}
                  onValueChange={(v) => setPaymentTerms(v as PurchasePaymentTerms)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">{t("paymentTerms.advance")}</SelectItem>
                    <SelectItem value="on_delivery">{t("paymentTerms.on_delivery")}</SelectItem>
                    <SelectItem value="credit">{t("paymentTerms.credit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <FieldLabel htmlFor="notes" labelKey="procurement.fields.notes" />
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("common.optional")}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel labelKey="procurement.fields.lineItems" className="mb-0" />
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="me-1 h-3 w-3" />
                {t("procurement.documents.addLine")}
              </Button>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-6">
                <div className="md:col-span-2 space-y-1">
                  <FieldLabel className="text-xs" labelKey="procurement.fields.product" />
                  <Select
                    value={line.item_id ? line.item_id : undefined}
                    onValueChange={(id) => pickCatalogItem(index, id)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("procurement.placeholders.pickCatalog")} />
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
                    placeholder={t("procurement.placeholders.typeItemName")}
                    value={line.item_name}
                    onChange={(e) => updateLine(index, { item_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-xs" labelKey="procurement.fields.qty" />
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={line.qty}
                    onChange={(e) => updateLine(index, { qty: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-xs" labelKey="procurement.fields.uom" />
                  <Input
                    value={line.uom}
                    onChange={(e) => updateLine(index, { uom: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-xs" labelKey="procurement.fields.unitPrice" />
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={line.unit_price}
                    onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2">
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
            {t("procurement.documents.estTotalInclVat")} AED {total.toLocaleString()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving
              ? t("common.creating")
              : `${t("common.create")} ${t(kindCreateKey)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
