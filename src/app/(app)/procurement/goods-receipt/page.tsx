"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ProcurementListHeader, mrnColumns } from "@/components/modules/procurement-shared";
import { fetchMaterialReceiptNotes, procurementAction } from "@/lib/data/procurement";
import type { MaterialReceiptNote } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function MaterialReceiptNotesPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<MaterialReceiptNote[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(await fetchMaterialReceiptNotes(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const postMrn = async (mrn: MaterialReceiptNote) => {
    setActing(mrn.id);
    const result = await procurementAction<MaterialReceiptNote>(
      "material_receipt_notes",
      currentCompanyId,
      mrn.id,
      "post",
      { price_updates: mrn.price_updates }
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("MRN posted — price updates applied");
    void load();
  };

  const columns: ColumnDef<MaterialReceiptNote>[] = [
    ...mrnColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mrn = row.original;
        if (mrn.status !== "draft") return null;
        return (
          <Button
            size="sm"
            disabled={acting === mrn.id}
            onClick={() => void postMrn(mrn)}
          >
            <Check className="mr-1 h-3 w-3" />
            Post MRN
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title="Material Receipt Notes (MRN)"
        description="Step 5–6 — warehouse receipt and price updation; create from approved LPO"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
