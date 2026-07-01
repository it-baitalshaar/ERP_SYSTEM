"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus, Send } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BilingualText, FieldLabel } from "@/components/i18n/field-label";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { materialRequestToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  useMaterialRequestColumns,
} from "@/components/modules/procurement-shared";
import { PurchaseDocumentFormDialog } from "@/components/procurement/purchase-document-form-dialog";
import {
  fetchMaterialRequests,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { MaterialRequest, PurchasePaymentTerms, Supplier } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "sonner";

export default function MaterialRequestsPage() {
  const { companyId, branchId } = useDocumentContext();
  const { t, label } = useTranslations();
  const materialRequestColumns = useMaterialRequestColumns();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertMrId, setConvertMrId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PurchasePaymentTerms>("credit");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetchMaterialRequests(companyId, branchId),
      fetchSuppliers(companyId),
    ]);
    setRequests(r);
    setSuppliers(s);
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, successKey: string) => {
    setActing(id);
    const result = await procurementAction<MaterialRequest>(
      "material_requests",
      companyId,
      id,
      action
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t(successKey));
    void load();
  };

  const handleConvert = async () => {
    if (!convertMrId || !supplierId) {
      toast.error(t("common.selectSupplier"));
      return;
    }
    setActing(convertMrId);
    const result = await procurementAction(
      "material_requests",
      companyId,
      convertMrId,
      "convert_to_lpo",
      { supplier_id: supplierId, payment_terms_type: paymentTerms }
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("procurement.pages.materialRequests.lpoCreated"));
    setConvertOpen(false);
    void load();
  };

  const columns: ColumnDef<MaterialRequest>[] = [
    ...materialRequestColumns,
    createPrintColumn(materialRequestToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => {
        const mr = row.original;
        const busy = acting === mr.id;
        return (
          <div className="flex flex-wrap gap-1">
            {mr.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(mr.id, "submit", "procurement.pages.materialRequests.submitted")
                }
              >
                <Send className="me-1 h-3 w-3" />
                {t("procurement.pages.purchaseOrders.submit")}
              </Button>
            )}
            {(mr.status === "draft" || mr.status === "pending_approval") && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction(mr.id, "approve", "procurement.pages.materialRequests.approved")
                }
              >
                {t("procurement.pages.purchaseOrders.approve")}
              </Button>
            )}
            {mr.status === "approved" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  setConvertMrId(mr.id);
                  setSupplierId(suppliers.find((s) => !s.is_blocked)?.id ?? "");
                  setConvertOpen(true);
                }}
              >
                <ArrowRight className="me-1 h-3 w-3" />
                {t("procurement.pages.materialRequests.toLpo")}
              </Button>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="material_requests"
              documentId={mr.id}
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
        title={<BilingualText labelKey="procurement.pages.materialRequests.title" />}
        description={<BilingualText labelKey="procurement.pages.materialRequests.description" />}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t("procurement.pages.materialRequests.new")}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={requests} searchKey="number" />
        </CardContent>
      </Card>

      <PurchaseDocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="material_request"
        companyId={companyId}
        branchId={branchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <BilingualText labelKey="procurement.pages.materialRequests.convertTitle" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel labelKey="procurement.fields.supplier" />
              <Select value={supplierId || undefined} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("procurement.placeholders.selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s) => !s.is_blocked)
                    .map((s) => (
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleConvert()} disabled={acting !== null}>
              {t("procurement.pages.materialRequests.createLpo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
