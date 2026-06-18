"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ProcurementListHeader,
  deliveryNoteColumns,
} from "@/components/modules/procurement-shared";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { fetchSupplierDeliveryNotes } from "@/lib/data/procurement";
import type { SupplierDeliveryNote } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function SupplierDeliveryNotesPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<SupplierDeliveryNote[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchSupplierDeliveryNotes(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <ProcurementListHeader
        title="Supplier Delivery Notes"
        description="Step 4 — inbound delivery proof; create from an approved LPO"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={deliveryNoteColumns} data={rows} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
