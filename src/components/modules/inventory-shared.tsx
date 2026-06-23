"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { Item, StockLevelRow, StockMovementRow } from "@/lib/types";

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
    accessorKey: "cost_price",
    header: "Cost (buy)",
    cell: ({ row }) => formatAed(row.original.cost_price ?? 0),
  },
  {
    accessorKey: "unit_price",
    header: "Sale price",
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

export const stockMovementColumns: ColumnDef<StockMovementRow>[] = [
  { accessorKey: "created_at", header: "Date" },
  { accessorKey: "item_sku", header: "SKU" },
  { accessorKey: "item_name", header: "Product" },
  { accessorKey: "warehouse_name", header: "Warehouse" },
  {
    accessorKey: "movement_type",
    header: "Type",
    cell: ({ row }) => (
      <span className={row.original.movement_type === "in" ? "text-success" : "text-destructive"}>
        {row.original.movement_type === "in" ? "Stock in" : "Stock out"}
      </span>
    ),
  },
  {
    accessorKey: "qty",
    header: "Qty",
    cell: ({ row }) => row.original.qty.toLocaleString(),
  },
  {
    id: "reference",
    header: "Reference",
    cell: ({ row }) =>
      row.original.reference_number
        ? `${row.original.reference_type} ${row.original.reference_number}`
        : row.original.reference_type,
  },
];
