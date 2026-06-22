"use client";

import { useCallback, useEffect, useState } from "react";
import { FileInput, Plus, Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { DocumentFormDialog } from "@/components/sales/document-form-dialog";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { salesOrderToPrintable } from "@/lib/documents/mappers";
import { SalesListHeader, salesOrderColumns } from "@/components/modules/sales-shared";
import { fetchCustomers, fetchSalesOrders, salesAction } from "@/lib/data/sales";
import type { Customer, SalesOrder } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function SalesOrdersPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, c] = await Promise.all([
      fetchSalesOrders(currentCompanyId),
      fetchCustomers(currentCompanyId),
    ]);
    setOrders(o);
    setCustomers(c);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await salesAction<SalesOrder>("orders", currentCompanyId, id, action);
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    void load();
  };

  const columns: ColumnDef<SalesOrder>[] = [
    ...salesOrderColumns,
    createPrintColumn(salesOrderToPrintable),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        const busy = acting === order.id;
        return (
          <div className="flex flex-wrap gap-1">
            {order.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runAction(order.id, "submit", "Submitted for approval")}
              >
                <Send className="mr-1 h-3 w-3" />
                Submit
              </Button>
            )}
            {(order.status === "draft" || order.status === "pending_approval") && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runAction(order.id, "approve", "Sales order approved")}
              >
                Approve
              </Button>
            )}
            {order.status === "approved" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction(order.id, "convert_to_invoice", "Tax invoice created")
                }
              >
                <FileInput className="mr-1 h-3 w-3" />
                To invoice
              </Button>
            )}
            <AdminDocumentDeleteButton
              module="sales"
              resource="orders"
              documentId={order.id}
              companyId={currentCompanyId}
              onDeleted={() => void load()}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <SalesListHeader
        title="Sales Orders"
        description="Draft → submit → approve → invoice"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New sales order
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={orders} searchKey="number" />
        </CardContent>
      </Card>

      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="order"
        companyId={currentCompanyId}
        branchId={currentBranchId}
        customers={customers}
        onCreated={() => void load()}
      />
    </div>
  );
}
