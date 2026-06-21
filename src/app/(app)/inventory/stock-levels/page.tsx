"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { InventoryListHeader, stockLevelColumns } from "@/components/modules/inventory-shared";
import { fetchStockLevels } from "@/lib/data/inventory";
import type { StockLevelRow } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function StockLevelsPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<StockLevelRow[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchStockLevels(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<StockLevelRow>[] = [
    ...stockLevelColumns,
    {
      id: "status",
      header: "Alert",
      cell: ({ row }) => {
        const low = row.original.qty_on_hand <= row.original.reorder_level;
        return low ? (
          <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
            Low stock
          </Badge>
        ) : (
          <Badge variant="outline" className="border-success/30 text-success">
            OK
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <InventoryListHeader
        title="Stock Levels"
        description="Per-warehouse quantities — updated by MRN (in) and delivery notes (out)"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="item_name" />
        </CardContent>
      </Card>
    </div>
  );
}
