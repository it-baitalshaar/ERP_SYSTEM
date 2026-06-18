"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import {
  ProcurementListHeader,
  supplierInvoiceColumns,
} from "@/components/modules/procurement-shared";
import { SupplierInvoiceFormDialog } from "@/components/procurement/supplier-invoice-form-dialog";
import {
  fetchSupplierInvoices,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { Supplier, SupplierInvoice } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function SupplierInvoicesPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [i, s] = await Promise.all([
      fetchSupplierInvoices(currentCompanyId),
      fetchSuppliers(currentCompanyId),
    ]);
    setInvoices(i);
    setSuppliers(s);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await procurementAction<SupplierInvoice>(
      "supplier_invoices",
      currentCompanyId,
      id,
      action
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    void load();
  };

  const columns: ColumnDef<SupplierInvoice>[] = [
    ...supplierInvoiceColumns,
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
                onClick={() => void runAction(inv.id, "post", "Supplier invoice posted")}
              >
                <Check className="mr-1 h-3 w-3" />
                Post
              </Button>
            )}
            {inv.status === "posted" && !inv.is_paid && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runAction(inv.id, "mark_paid", "Marked as paid")}
              >
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
      <ProcurementListHeader
        title="Supplier Invoices"
        description="Step 7 — supplier tax invoice; 3-way match vs LPO and MRN"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New invoice
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={invoices} searchKey="number" />
        </CardContent>
      </Card>

      <SupplierInvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={currentCompanyId}
        branchId={currentBranchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />
    </div>
  );
}
