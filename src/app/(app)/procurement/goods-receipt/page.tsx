"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { mrnToPrintable } from "@/lib/documents/mappers";
import { ProcurementListHeader, mrnColumns } from "@/components/modules/procurement-shared";
import { MrnToInvoiceDialog } from "@/components/procurement/mrn-to-invoice-dialog";
import { MrnPostDialog } from "@/components/procurement/mrn-post-dialog";
import { fetchMaterialReceiptNotes } from "@/lib/data/procurement";
import type { MaterialReceiptNote } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function MaterialReceiptNotesPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [rows, setRows] = useState<MaterialReceiptNote[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedMrn, setSelectedMrn] = useState<MaterialReceiptNote | null>(null);

  const load = useCallback(async () => {
    setRows(await fetchMaterialReceiptNotes(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<MaterialReceiptNote>[] = [
    ...mrnColumns,
    createPrintColumn(mrnToPrintable),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mrn = row.original;
        if (mrn.status !== "draft") {
          return (
            <div className="flex flex-wrap gap-1">
              {mrn.status === "posted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMrn(mrn);
                    setInvoiceOpen(true);
                  }}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  Supplier invoice
                </Button>
              )}
              <AdminDocumentDeleteButton
                module="procurement"
                resource="material_receipt_notes"
                documentId={mrn.id}
                companyId={currentCompanyId}
                onDeleted={() => void load()}
              />
            </div>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              onClick={() => {
                setSelectedMrn(mrn);
                setPostOpen(true);
              }}
            >
              <Check className="mr-1 h-3 w-3" />
              Post MRN
            </Button>
            <AdminDocumentDeleteButton
              module="procurement"
              resource="material_receipt_notes"
              documentId={mrn.id}
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
      <ProcurementListHeader
        title="Material Receipt Notes (MRN)"
        description="Step 5–6 — warehouse receipt and price updation; posting increases stock"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="number" />
        </CardContent>
      </Card>

      <MrnPostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        companyId={currentCompanyId}
        mrn={selectedMrn}
        onPosted={() => void load()}
      />

      <MrnToInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        companyId={currentCompanyId}
        branchId={currentBranchId}
        mrn={selectedMrn}
        onCreated={() => void load()}
      />
    </div>
  );
}
