"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/i18n/field-label";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { mrnToPrintable } from "@/lib/documents/mappers";
import { ProcurementListHeader, useMrnColumns } from "@/components/modules/procurement-shared";
import { MrnToInvoiceDialog } from "@/components/procurement/mrn-to-invoice-dialog";
import { MrnPostDialog } from "@/components/procurement/mrn-post-dialog";
import { fetchMaterialReceiptNotes, fetchPurchaseOrders } from "@/lib/data/procurement";
import type { LineItem, MaterialReceiptNote, PurchaseOrder } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";

export default function MaterialReceiptNotesPage() {
  const { companyId, branchId } = useDocumentContext();
  const { t, label } = useTranslations();
  const mrnColumns = useMrnColumns();
  const [rows, setRows] = useState<MaterialReceiptNote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedMrn, setSelectedMrn] = useState<MaterialReceiptNote | null>(null);

  const load = useCallback(async () => {
    const [mrns, orders] = await Promise.all([
      fetchMaterialReceiptNotes(companyId, branchId),
      fetchPurchaseOrders(companyId, branchId),
    ]);
    setRows(mrns);
    setPurchaseOrders(orders);
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedLpoLines: LineItem[] = useMemo(() => {
    if (!selectedMrn?.purchase_order_id) return [];
    return purchaseOrders.find((p) => p.id === selectedMrn.purchase_order_id)?.lines ?? [];
  }, [selectedMrn, purchaseOrders]);

  const columns: ColumnDef<MaterialReceiptNote>[] = [
    ...mrnColumns,
    createPrintColumn(mrnToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
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
                  <FileText className="me-1 h-3 w-3" />
                  {t("procurement.pages.goodsReceipt.supplierInvoice")}
                </Button>
              )}
              <AdminDocumentDeleteButton
                module="procurement"
                resource="material_receipt_notes"
                documentId={mrn.id}
                companyId={companyId}
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
              <Check className="me-1 h-3 w-3" />
              {t("procurement.pages.goodsReceipt.postMrn")}
            </Button>
            <AdminDocumentDeleteButton
              module="procurement"
              resource="material_receipt_notes"
              documentId={mrn.id}
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
        title={<BilingualText labelKey="procurement.pages.goodsReceipt.title" />}
        description={<BilingualText labelKey="procurement.pages.goodsReceipt.description" />}
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="number" />
        </CardContent>
      </Card>

      <MrnPostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        companyId={companyId}
        mrn={selectedMrn}
        lpoLines={selectedLpoLines}
        onPosted={() => void load()}
      />

      <MrnToInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        companyId={companyId}
        branchId={branchId}
        mrn={selectedMrn}
        onCreated={() => void load()}
      />
    </div>
  );
}
