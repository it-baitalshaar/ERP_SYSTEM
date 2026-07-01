"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ProcurementListHeader,
  useDeliveryNoteColumns,
} from "@/components/modules/procurement-shared";
import { BilingualText } from "@/components/i18n/field-label";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { supplierDeliveryNoteToPrintable } from "@/lib/documents/mappers";
import { fetchSupplierDeliveryNotes } from "@/lib/data/procurement";
import type { SupplierDeliveryNote } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";

export default function SupplierDeliveryNotesPage() {
  const { companyId, branchId } = useDocumentContext();
  const { label } = useTranslations();
  const deliveryNoteColumns = useDeliveryNoteColumns();
  const [rows, setRows] = useState<SupplierDeliveryNote[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchSupplierDeliveryNotes(companyId, branchId));
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<SupplierDeliveryNote>[] = [
    ...deliveryNoteColumns,
    createPrintColumn(supplierDeliveryNoteToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => (
        <AdminDocumentDeleteButton
          module="procurement"
          resource="supplier_delivery_notes"
          documentId={row.original.id}
          companyId={companyId}
          onDeleted={() => void load()}
        />
      ),
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title={<BilingualText labelKey="procurement.pages.deliveryNotes.title" />}
        description={<BilingualText labelKey="procurement.pages.deliveryNotes.description" />}
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
