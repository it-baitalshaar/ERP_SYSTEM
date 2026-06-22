"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import type {
  MaterialReceiptNote,
  MaterialRequest,
  ProformaInvoice,
  PurchaseOrder,
  PurchasePayment,
  SupplierDeliveryNote,
  SupplierInvoice,
} from "@/lib/types";

export const formatAed = (n: number) => `AED ${n.toLocaleString()}`;

export function ProcurementListHeader({
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

export const materialRequestColumns: ColumnDef<MaterialRequest>[] = [
  { accessorKey: "number", header: "Number" },
  { accessorKey: "requester_name", header: "Requested by" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "total",
    header: "Est. total",
    cell: ({ row }) => formatAed(row.original.total),
  },
];

export const purchaseOrderColumns: ColumnDef<PurchaseOrder>[] = [
  { accessorKey: "number", header: "LPO" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "payment_terms_type",
    header: "Payment",
    cell: ({ row }) => row.original.payment_terms_type.replace("_", " "),
  },
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

export const proformaColumns: ColumnDef<ProformaInvoice>[] = [
  { accessorKey: "number", header: "Proforma" },
  { accessorKey: "purchase_order_number", header: "LPO" },
  { accessorKey: "supplier_name", header: "Supplier" },
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

export const deliveryNoteColumns: ColumnDef<SupplierDeliveryNote>[] = [
  { accessorKey: "number", header: "Delivery note" },
  { accessorKey: "purchase_order_number", header: "LPO" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export const mrnColumns: ColumnDef<MaterialReceiptNote>[] = [
  { accessorKey: "number", header: "MRN" },
  { accessorKey: "purchase_order_number", header: "LPO" },
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

export const supplierInvoiceColumns: ColumnDef<SupplierInvoice>[] = [
  { accessorKey: "number", header: "Invoice" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "purchase_order_number", header: "LPO" },
  { accessorKey: "mrn_number", header: "MRN" },
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
];

export const purchasePaymentColumns: ColumnDef<PurchasePayment>[] = [
  { accessorKey: "number", header: "Payment" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "payment_type", header: "Type" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatAed(row.original.amount),
  },
];
