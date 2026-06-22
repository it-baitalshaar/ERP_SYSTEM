"use client";

import { useCallback, useEffect, useState } from "react";
import { FileInput, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { DocumentFormDialog } from "@/components/sales/document-form-dialog";
import {
  SalesListHeader,
  quotationColumns,
} from "@/components/modules/sales-shared";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { quotationToPrintable } from "@/lib/documents/mappers";
import { StatusBadge } from "@/components/shared/status-badge";
import { fetchCustomers, fetchQuotations, salesAction } from "@/lib/data/sales";
import type { Customer, Quotation } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function QuotationsPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [q, c] = await Promise.all([
      fetchQuotations(currentCompanyId),
      fetchCustomers(currentCompanyId),
    ]);
    setQuotations(q);
    setCustomers(c);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await salesAction<Quotation>(
      "quotations",
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

  const columns: ColumnDef<Quotation>[] = [
    ...quotationColumns,
    createPrintColumn(quotationToPrintable),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const q = row.original;
        const busy = acting === q.id;
        return (
          <div className="flex flex-wrap gap-1">
            {q.status === "draft" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runAction(q.id, "approve", "Quotation approved")}
                >
                  <ThumbsUp className="mr-1 h-3 w-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void runAction(q.id, "reject", "Quotation rejected")}
                >
                  <ThumbsDown className="mr-1 h-3 w-3" />
                  Reject
                </Button>
              </>
            )}
            {q.status === "approved" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction(q.id, "convert_to_order", "Sales order created from quotation")
                }
              >
                <FileInput className="mr-1 h-3 w-3" />
                To SO
              </Button>
            )}
            {q.status !== "draft" && q.status !== "approved" && (
              <StatusBadge status={q.status} />
            )}
            <AdminDocumentDeleteButton
              module="sales"
              resource="quotations"
              documentId={q.id}
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
        title="Quotations"
        description="Draft → approve → convert to sales order"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New quotation
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={quotations} searchKey="number" />
        </CardContent>
      </Card>

      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="quotation"
        companyId={currentCompanyId}
        branchId={currentBranchId}
        customers={customers}
        onCreated={() => void load()}
      />
    </div>
  );
}
