"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  PackageCheck,
  Plus,
  Send,
  Truck,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/i18n/field-label";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { purchaseOrderToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  usePurchaseOrderColumns,
} from "@/components/modules/procurement-shared";
import { PurchaseDocumentFormDialog } from "@/components/procurement/purchase-document-form-dialog";
import {
  fetchPurchaseOrders,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { PurchaseOrder, Supplier } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const { companyId, branchId } = useDocumentContext();
  const { t, label } = useTranslations();
  const purchaseOrderColumns = usePurchaseOrderColumns();
  const currentWarehouseId = useAppStore((s) => s.currentWarehouseId);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, s] = await Promise.all([
      fetchPurchaseOrders(companyId, branchId),
      fetchSuppliers(companyId),
    ]);
    setOrders(o);
    setSuppliers(s);
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    id: string,
    action: string,
    successKey: string,
    extra?: Record<string, unknown>
  ) => {
    setActing(id);
    const result = await procurementAction("purchase_orders", companyId, id, action, extra);
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t(successKey), {
      description:
        action === "create_proforma"
          ? t("procurement.pages.purchaseOrders.proformaOpenHint")
          : undefined,
    });
    void load();
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    ...purchaseOrderColumns,
    createPrintColumn(purchaseOrderToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => {
        const po = row.original;
        const busy = acting === po.id;
        return (
          <div className="flex flex-wrap gap-1">
            {po.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    po.id,
                    "submit",
                    "procurement.pages.purchaseOrders.submitted"
                  )
                }
              >
                <Send className="me-1 h-3 w-3" />
                {t("procurement.pages.purchaseOrders.submit")}
              </Button>
            )}
            {(po.status === "draft" || po.status === "pending_approval") && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction(po.id, "approve", "procurement.pages.purchaseOrders.approved")
                }
              >
                {t("procurement.pages.purchaseOrders.approve")}
              </Button>
            )}
            {po.status === "approved" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      po.id,
                      "create_proforma",
                      "procurement.pages.purchaseOrders.proformaCreated"
                    )
                  }
                >
                  <FileText className="me-1 h-3 w-3" />
                  {t("procurement.pages.purchaseOrders.proforma")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      po.id,
                      "create_delivery_note",
                      "procurement.pages.purchaseOrders.deliveryCreated"
                    )
                  }
                >
                  <Truck className="me-1 h-3 w-3" />
                  {t("procurement.pages.purchaseOrders.delivery")}
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void runAction(po.id, "create_mrn", "procurement.pages.purchaseOrders.mrnCreated", {
                      warehouse_id: currentWarehouseId || undefined,
                    })
                  }
                >
                  <PackageCheck className="me-1 h-3 w-3" />
                  {t("procurement.pages.purchaseOrders.mrn")}
                </Button>
              </>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="purchase_orders"
              documentId={po.id}
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
        title={<BilingualText labelKey="procurement.pages.purchaseOrders.title" />}
        description={<BilingualText labelKey="procurement.pages.purchaseOrders.description" />}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t("procurement.pages.purchaseOrders.new")}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={orders} searchKey="number" />
        </CardContent>
      </Card>

      <PurchaseDocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="lpo"
        companyId={companyId}
        branchId={branchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />
    </div>
  );
}
