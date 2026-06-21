"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { Item, StockLevelRow } from "@/lib/types";

export const formatAed = (n: number) => `AED ${n.toLocaleString()}`;

export function InventoryListHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      action={
        action ?? (
          <Button variant="outline" disabled>
            Export
          </Button>
        )
      }
    />
  );
}

export const itemColumns: ColumnDef<Item>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Product" },
  { accessorKey: "base_uom", header: "UOM" },
  {
    accessorKey: "unit_price",
    header: "Unit price",
    cell: ({ row }) => formatAed(row.original.unit_price),
  },
  {
    accessorKey: "reorder_level",
    header: "Reorder at",
    cell: ({ row }) => row.original.reorder_level.toLocaleString(),
  },
  {
    accessorKey: "is_batch_managed",
    header: "Batch",
    cell: ({ row }) => (row.original.is_batch_managed ? "Yes" : "No"),
  },
];

export const stockLevelColumns: ColumnDef<StockLevelRow>[] = [
  { accessorKey: "item_sku", header: "SKU" },
  { accessorKey: "item_name", header: "Product" },
  { accessorKey: "warehouse_name", header: "Warehouse" },
  {
    accessorKey: "qty_on_hand",
    header: "On hand",
    cell: ({ row }) => row.original.qty_on_hand.toLocaleString(),
  },
  {
    accessorKey: "qty_reserved",
    header: "Reserved",
    cell: ({ row }) => row.original.qty_reserved.toLocaleString(),
  },
  {
    accessorKey: "reorder_level",
    header: "Reorder",
    cell: ({ row }) => row.original.reorder_level.toLocaleString(),
  },
];
