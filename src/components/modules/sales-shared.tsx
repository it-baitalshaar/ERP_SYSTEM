"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Quotation, SalesOrder, TaxInvoice } from "@/lib/types";

export const formatAed = (n: number) => `AED ${n.toLocaleString()}`;

export function SalesListHeader({
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
          <>
            <Button variant="outline" disabled>
              Export
            </Button>
          </>
        )
      }
    />
  );
}

export const quotationColumns: ColumnDef<Quotation>[] = [
  { accessorKey: "number", header: "Number" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "valid_until", header: "Valid Until" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatAed(row.original.total),
  },
];

export const salesOrderColumns: ColumnDef<SalesOrder>[] = [
  { accessorKey: "number", header: "Number" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatAed(row.original.total),
  },
];

export const invoiceColumns: ColumnDef<TaxInvoice>[] = [
  { accessorKey: "number", header: "Number" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "total",
    header: "Total (incl. VAT)",
    cell: ({ row }) => formatAed(row.original.total),
  },
  {
    accessorKey: "is_paid",
    header: "Paid",
    cell: ({ row }) => (row.original.is_paid ? "Yes" : "No"),
  },
  {
    accessorKey: "e_invoice_status",
    header: "E-Invoice",
    cell: ({ row }) => row.original.e_invoice_status ?? "—",
  },
];
