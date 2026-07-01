"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { InventoryListHeader, stockLevelColumns } from "@/components/modules/inventory-shared";
import { fetchStockLevels } from "@/lib/data/inventory";
import { fetchCustomerProductBlocks } from "@/lib/data/sales";
import type { CustomerProductBlock, StockLevelRow } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { CUSTOMER_PRODUCT_BLOCKS_FLAG } from "@/lib/sales/customer-blocks";

export default function StockLevelsPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const blocksEnabled = useAppStore((s) => s.isFeatureEnabled(CUSTOMER_PRODUCT_BLOCKS_FLAG));
  const [rows, setRows] = useState<StockLevelRow[]>([]);
  const [blocks, setBlocks] = useState<CustomerProductBlock[]>([]);

  const load = useCallback(async () => {
    const stock = await fetchStockLevels(currentCompanyId);
    setRows(stock);
    if (blocksEnabled) {
      setBlocks(await fetchCustomerProductBlocks(currentCompanyId, { activeOnly: true }));
    } else {
      setBlocks([]);
    }
  }, [currentCompanyId, blocksEnabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const blocksByItem = useMemo(() => {
    const map = new Map<string, CustomerProductBlock[]>();
    for (const block of blocks) {
      const list = map.get(block.item_id) ?? [];
      list.push(block);
      map.set(block.item_id, list);
    }
    return map;
  }, [blocks]);

  const columns: ColumnDef<StockLevelRow>[] = [
    ...stockLevelColumns,
    ...(blocksEnabled
      ? [
          {
            id: "reservations",
            header: "Customer holds",
            cell: ({ row }: { row: { original: StockLevelRow } }) => {
              const itemBlocks = blocksByItem.get(row.original.item_id) ?? [];
              if (!itemBlocks.length) {
                return <span className="text-xs text-muted-foreground">—</span>;
              }
              return (
                <div className="flex flex-col gap-1">
                  {itemBlocks.map((b) => (
                    <Badge
                      key={b.id}
                      variant="outline"
                      className="w-fit border-amber-400 text-amber-800 dark:text-amber-200"
                    >
                      {b.qty} for {b.customer_name ?? "customer"} until{" "}
                      {new Date(b.blocked_until).toLocaleDateString()}
                    </Badge>
                  ))}
                </div>
              );
            },
          } as ColumnDef<StockLevelRow>,
        ]
      : []),
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
        description="Per-warehouse quantities — customer reservations shown when product blocks are enabled"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="item_name" />
        </CardContent>
      </Card>
    </div>
  );
}
