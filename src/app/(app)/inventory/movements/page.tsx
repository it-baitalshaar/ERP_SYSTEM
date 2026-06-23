"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import {
  InventoryListHeader,
  stockMovementColumns,
} from "@/components/modules/inventory-shared";
import { fetchStockMovements } from "@/lib/data/inventory";
import type { StockMovementRow } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function StockMovementsPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [rows, setRows] = useState<StockMovementRow[]>([]);

  const load = useCallback(async () => {
    setRows(await fetchStockMovements(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <InventoryListHeader
        title="Stock Movements"
        description="Audit trail — MRN receipts (in) and delivery notes (out)"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={stockMovementColumns} data={rows} searchKey="item_name" />
        </CardContent>
      </Card>
    </div>
  );
}
