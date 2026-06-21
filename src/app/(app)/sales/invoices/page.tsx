"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Plus, Send, Truck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { DocumentFormDialog } from "@/components/sales/document-form-dialog";
import { SalesListHeader, invoiceColumns } from "@/components/modules/sales-shared";
import { fetchCustomers, fetchTaxInvoices, salesAction } from "@/lib/data/sales";
import type { Customer, TaxInvoice } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function TaxInvoicesPage() {
  const { currentCompanyId, currentBranchId, currentWarehouseId } = useAppStore();
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [i, c] = await Promise.all([
      fetchTaxInvoices(currentCompanyId),
      fetchCustomers(currentCompanyId),
    ]);
    setInvoices(i);
    setCustomers(c);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    id: string,
    action: string,
    success: string,
    extra?: Record<string, unknown>
  ) => {
    setActing(id);
    const result = await salesAction<TaxInvoice>("invoices", currentCompanyId, id, action, extra);
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    void load();
  };

  const columns: ColumnDef<TaxInvoice>[] = [
    ...invoiceColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original;
        const busy = acting === inv.id;
        return (
          <div className="flex flex-wrap gap-1">
            {inv.status === "draft" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runAction(inv.id, "post", "Invoice posted — customer balance updated")}
              >
                <Send className="mr-1 h-3 w-3" />
                Post
              </Button>
            )}
            {inv.status === "posted" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    inv.id,
                    "create_delivery_note",
                    "Delivery note created — post it to deduct stock",
                    { warehouse_id: currentWarehouseId || undefined }
                  )
                }
              >
                <Truck className="mr-1 h-3 w-3" />
                Delivery note
              </Button>
            )}
            {inv.status === "posted" && !inv.is_paid && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runAction(inv.id, "mark_paid", "Marked as paid")}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Mark paid
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <SalesListHeader
        title="Tax Invoices"
        description="UAE VAT 5% — post to update customer outstanding balance"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New invoice
          </Button>
        }
      />
      <div className="mb-4">
        <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
          Posting an invoice increases customer outstanding balance and may block over-limit accounts
        </Badge>
      </div>
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={invoices} searchKey="number" />
        </CardContent>
      </Card>

      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="invoice"
        companyId={currentCompanyId}
        branchId={currentBranchId}
        customers={customers}
        onCreated={() => void load()}
      />
    </div>
  );
}
