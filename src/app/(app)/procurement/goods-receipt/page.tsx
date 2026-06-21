"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ProcurementListHeader, mrnColumns } from "@/components/modules/procurement-shared";
import { MrnPostDialog } from "@/components/procurement/mrn-post-dialog";
import { fetchMaterialReceiptNotes } from "@/lib/data/procurement";
import type { MaterialReceiptNote } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function MaterialReceiptNotesPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<MaterialReceiptNote[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const [selectedMrn, setSelectedMrn] = useState<MaterialReceiptNote | null>(null);

  const load = useCallback(async () => {
    setRows(await fetchMaterialReceiptNotes(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

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
            onClick={() => {
              setSelectedMrn(mrn);
              setPostOpen(true);
            }}
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
    </div>
  );
}
