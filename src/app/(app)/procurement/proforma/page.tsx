"use client";

import { useCallback, useEffect, useState } from "react";
import { ProcurementListHeader, proformaColumns } from "@/components/modules/procurement-shared";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { fetchProformaInvoices } from "@/lib/data/procurement";
import type { ProformaInvoice } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function ProformaInvoicesPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<ProformaInvoice[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchProformaInvoices(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <ProcurementListHeader
        title="Proforma Invoices"
        description="Step 3 — supplier proforma; create from an approved LPO"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={proformaColumns} data={rows} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
