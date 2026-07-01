"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BilingualText, FieldLabel } from "@/components/i18n/field-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { purchasePaymentToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  formatAed,
  usePurchasePaymentColumns,
} from "@/components/modules/procurement-shared";
import {
  createPurchasePayment,
  fetchPurchasePayments,
  fetchSupplierInvoices,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { PurchasePayment, PurchasePaymentType, Supplier, SupplierInvoice } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "sonner";

const NONE_INVOICE = "__none__";

export default function PurchasePaymentsPage() {
  const { companyId, branchId } = useDocumentContext();
  const { t, label } = useTranslations();
  const purchasePaymentColumns = usePurchasePaymentColumns();
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierInvoiceId, setSupplierInvoiceId] = useState<string>(NONE_INVOICE);
  const [amount, setAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>("final");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, s, inv] = await Promise.all([
      fetchPurchasePayments(companyId, branchId),
      fetchSuppliers(companyId),
      fetchSupplierInvoices(companyId, branchId),
    ]);
    setPayments(p);
    setSuppliers(s);
    setInvoices(inv);
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const payableInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          inv.supplier_id === supplierId &&
          inv.status === "posted" &&
          !inv.is_paid
      ),
    [invoices, supplierId]
  );

  const openNew = () => {
    const first = suppliers.find((s) => !s.is_blocked);
    setSupplierId(first?.id ?? "");
    setSupplierInvoiceId(NONE_INVOICE);
    setAmount(0);
    setPaymentType("final");
    setReference("");
    setDialogOpen(true);
  };

  const onSupplierChange = (id: string) => {
    setSupplierId(id);
    setSupplierInvoiceId(NONE_INVOICE);
    setAmount(0);
  };

  const onInvoiceChange = (id: string) => {
    setSupplierInvoiceId(id);
    if (id === NONE_INVOICE) return;
    const inv = invoices.find((i) => i.id === id);
    if (inv) setAmount(inv.total);
  };

  const handleCreate = async () => {
    if (!supplierId) {
      toast.error(t("procurement.pages.payments.selectSupplier"));
      return;
    }
    if (amount <= 0) {
      toast.error(t("procurement.pages.payments.validAmount"));
      return;
    }

    setSaving(true);
    const result = await createPurchasePayment({
      company_id: companyId,
      branch_id: branchId,
      supplier_id: supplierId,
      supplier_invoice_id:
        supplierInvoiceId !== NONE_INVOICE ? supplierInvoiceId : undefined,
      amount,
      payment_type: paymentType,
      reference: reference || undefined,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(t("procurement.pages.payments.recorded"));
    setDialogOpen(false);
    void load();
  };

  const postPayment = async (id: string) => {
    setActing(id);
    const result = await procurementAction<PurchasePayment>(
      "purchase_payments",
      companyId,
      id,
      "post"
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("procurement.pages.payments.posted"));
    void load();
  };

  const columns: ColumnDef<PurchasePayment>[] = [
    ...purchasePaymentColumns,
    createPrintColumn(purchasePaymentToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => {
        const pay = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {pay.status === "draft" && (
              <Button
                size="sm"
                disabled={acting === pay.id}
                onClick={() => void postPayment(pay.id)}
              >
                <Check className="me-1 h-3 w-3" />
                {t("procurement.pages.supplierInvoices.post")}
              </Button>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="purchase_payments"
              documentId={pay.id}
              companyId={companyId}
              onDeleted={() => void load()}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title={<BilingualText labelKey="procurement.pages.payments.title" />}
        description={<BilingualText labelKey="procurement.pages.payments.description" />}
        action={
          <Button onClick={openNew}>
            <Plus className="me-2 h-4 w-4" />
            {t("procurement.pages.payments.record")}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={payments} searchKey="number" />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <BilingualText labelKey="procurement.pages.payments.recordTitle" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel labelKey="procurement.fields.supplier" />
              <Select value={supplierId || undefined} onValueChange={onSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("procurement.placeholders.selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s) => !s.is_blocked)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {(s.outstanding_balance ?? 0) > 0
                          ? ` — due ${formatAed(s.outstanding_balance ?? 0)}`
                          : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel labelKey="procurement.pages.payments.supplierInvoiceOptional" />
              <Select value={supplierInvoiceId} onValueChange={onInvoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("procurement.pages.payments.linkInvoice")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_INVOICE}>
                    {t("procurement.pages.payments.noInvoice")}
                  </SelectItem>
                  {payableInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.number} — {formatAed(inv.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplierId && payableInvoices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("procurement.pages.payments.noUnpaidInvoices")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel labelKey="procurement.pages.payments.paymentType" />
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as PurchasePaymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">{t("paymentTerms.advance")}</SelectItem>
                  <SelectItem value="on_delivery">{t("paymentTerms.on_delivery")}</SelectItem>
                  <SelectItem value="partial">{t("procurement.pages.payments.partial")}</SelectItem>
                  <SelectItem value="final">{t("procurement.pages.payments.final")}</SelectItem>
                  <SelectItem value="credit">
                    {t("procurement.pages.payments.creditSettlement")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="pay-amount" labelKey="procurement.pages.payments.amountAed" />
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="pay-ref" labelKey="procurement.pages.payments.reference" />
              <Input
                id="pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t("procurement.pages.payments.referencePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
