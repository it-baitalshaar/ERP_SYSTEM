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
import { DataTable } from "@/components/shared/data-table";
import {
  ProcurementListHeader,
  purchaseOrderColumns,
} from "@/components/modules/procurement-shared";
import { PurchaseDocumentFormDialog } from "@/components/procurement/purchase-document-form-dialog";
import {
  fetchPurchaseOrders,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { PurchaseOrder, Supplier } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, s] = await Promise.all([
      fetchPurchaseOrders(currentCompanyId),
      fetchSuppliers(currentCompanyId),
    ]);
    setOrders(o);
    setSuppliers(s);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await procurementAction("purchase_orders", currentCompanyId, id, action);
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    void load();
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    ...purchaseOrderColumns,
    {
      id: "actions",
      header: "Actions",
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
                onClick={() => void runAction(po.id, "submit", "LPO submitted")}
              >
                <Send className="mr-1 h-3 w-3" />
                Submit
              </Button>
            )}
            {(po.status === "draft" || po.status === "pending_approval") && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runAction(po.id, "approve", "LPO approved")}
              >
                Approve
              </Button>
            )}
            {po.status === "approved" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(po.id, "create_proforma", "Proforma invoice created")
                  }
                >
                  <FileText className="mr-1 h-3 w-3" />
                  Proforma
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(po.id, "create_delivery_note", "Delivery note created")
                  }
                >
                  <Truck className="mr-1 h-3 w-3" />
                  Delivery
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void runAction(po.id, "create_mrn", "MRN created")}
                >
                  <PackageCheck className="mr-1 h-3 w-3" />
                  MRN
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title="Purchase Orders (LPO)"
        description="Step 2 — local purchase order; link proforma, delivery, and MRN"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New LPO
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
        companyId={currentCompanyId}
        branchId={currentBranchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />
    </div>
  );
}
