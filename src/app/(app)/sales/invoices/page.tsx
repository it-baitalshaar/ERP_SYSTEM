"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Plus, Send, Truck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { DocumentFormDialog } from "@/components/sales/document-form-dialog";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { taxInvoiceToPrintable } from "@/lib/documents/mappers";
import { SalesListHeader, invoiceColumns } from "@/components/modules/sales-shared";
import { PartialDeliveryDialog } from "@/components/sales/partial-delivery-dialog";
import { PartialPaymentDialog } from "@/components/sales/partial-payment-dialog";
import { fetchCustomers, fetchTaxInvoices, salesAction } from "@/lib/data/sales";
import {
  CUSTOMER_PRODUCT_BLOCKS_FLAG,
  PARTIAL_SALES_DELIVERY_FLAG,
} from "@/lib/sales/customer-blocks";
import type { Customer, TaxInvoice } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { useDocumentContext } from "@/hooks/use-document-context";
import { toast } from "sonner";

export default function TaxInvoicesPage() {
  const { companyId, branchId } = useDocumentContext();
  const currentWarehouseId = useAppStore((s) => s.currentWarehouseId);
  const partialDeliveryEnabled = useAppStore((s) =>
    s.isFeatureEnabled(PARTIAL_SALES_DELIVERY_FLAG)
  );
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [partialDnInvoice, setPartialDnInvoice] = useState<TaxInvoice | null>(null);
  const [partialPayInvoice, setPartialPayInvoice] = useState<TaxInvoice | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [i, c] = await Promise.all([
      fetchTaxInvoices(companyId, branchId),
      fetchCustomers(companyId),
    ]);
    setInvoices(i);
    setCustomers(c);
  }, [companyId, branchId]);

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
    const result = await salesAction<TaxInvoice>("invoices", companyId, id, action, extra);
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
    createPrintColumn(taxInvoiceToPrintable),
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
                onClick={() => {
                  if (partialDeliveryEnabled) {
                    setPartialDnInvoice(inv);
                  } else {
                    void runAction(
                      inv.id,
                      "create_delivery_note",
                      "Delivery note created — post it to deduct stock",
                      { warehouse_id: currentWarehouseId || undefined }
                    );
                  }
                }}
              >
                <Truck className="mr-1 h-3 w-3" />
                {partialDeliveryEnabled ? "Partial delivery" : "Delivery note"}
              </Button>
            )}
            {inv.status === "posted" && partialDeliveryEnabled && !inv.is_paid && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setPartialPayInvoice(inv)}
              >
                Record partial pay
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
            <AdminDocumentDeleteButton
              module="sales"
              resource="invoices"
              documentId={inv.id}
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
        companyId={companyId}
        branchId={branchId}
        customers={customers}
        onCreated={() => void load()}
      />

      {partialDnInvoice && (
        <PartialDeliveryDialog
          open={!!partialDnInvoice}
          onOpenChange={(o) => !o && setPartialDnInvoice(null)}
          invoice={partialDnInvoice}
          companyId={companyId}
          warehouseId={currentWarehouseId || undefined}
          onCreated={() => void load()}
        />
      )}

      {partialPayInvoice && partialDeliveryEnabled && (
        <PartialPaymentDialog
          open={!!partialPayInvoice}
          onOpenChange={(o) => !o && setPartialPayInvoice(null)}
          invoice={partialPayInvoice}
          companyId={companyId}
          warehouseId={currentWarehouseId || undefined}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
