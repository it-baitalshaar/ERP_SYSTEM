"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ProcurementListHeader,
  useProformaColumns,
} from "@/components/modules/procurement-shared";
import { BilingualText } from "@/components/i18n/field-label";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { proformaToPrintable } from "@/lib/documents/mappers";
import { fetchProformaInvoices } from "@/lib/data/procurement";
import type { ProformaInvoice } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";

export default function ProformaInvoicesPage() {
  const { companyId, branchId } = useDocumentContext();
  const { label } = useTranslations();
  const proformaColumns = useProformaColumns();
  const [rows, setRows] = useState<ProformaInvoice[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchProformaInvoices(companyId, branchId));
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<ProformaInvoice>[] = [
    ...proformaColumns,
    createPrintColumn(proformaToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => (
        <AdminDocumentDeleteButton
          module="procurement"
          resource="proforma_invoices"
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
        title={<BilingualText labelKey="procurement.pages.proforma.title" />}
        description={<BilingualText labelKey="procurement.pages.proforma.description" />}
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
