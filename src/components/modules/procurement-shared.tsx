"use client";

import { useMemo, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslations } from "@/hooks/use-translations";
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
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const { t } = useTranslations();

  return (
    <PageHeader
      title={title}
      description={description}
      action={
        action ?? (
          <Button variant="outline" disabled>
            {t("common.export")}
          </Button>
        )
      }
    />
  );
}

function headerCell(label: ReactNode) {
  return () => label;
}

export function useMaterialRequestColumns(): ColumnDef<MaterialRequest>[] {
  const { label, t } = useTranslations();

  return useMemo(
    () => [
      { accessorKey: "number", header: headerCell(label("procurement.fields.number")) },
      {
        accessorKey: "requester_name",
        header: headerCell(label("procurement.fields.requestedBy")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: headerCell(label("procurement.fields.estTotal")),
        cell: ({ row }) => formatAed(row.original.total),
      },
    ],
    [label, t]
  );
}

export function usePurchaseOrderColumns(): ColumnDef<PurchaseOrder>[] {
  const { label, t } = useTranslations();

  return useMemo(
    () => [
      { accessorKey: "number", header: headerCell(label("procurement.fields.lpo")) },
      {
        accessorKey: "supplier_name",
        header: headerCell(label("procurement.fields.supplier")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "payment_terms_type",
        header: headerCell(label("procurement.fields.payment")),
        cell: ({ row }) =>
          t(`paymentTerms.${row.original.payment_terms_type}`, row.original.payment_terms_type),
      },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: headerCell(label("procurement.fields.total")),
        cell: ({ row }) => formatAed(row.original.total),
      },
    ],
    [label, t]
  );
}

export function useProformaColumns(): ColumnDef<ProformaInvoice>[] {
  const { label } = useTranslations();

  return useMemo(
    () => [
      {
        accessorKey: "number",
        header: headerCell(label("procurement.fields.proforma")),
      },
      {
        accessorKey: "purchase_order_number",
        header: headerCell(label("procurement.fields.lpo")),
      },
      {
        accessorKey: "supplier_name",
        header: headerCell(label("procurement.fields.supplier")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: headerCell(label("procurement.fields.total")),
        cell: ({ row }) => formatAed(row.original.total),
      },
    ],
    [label]
  );
}

export function useDeliveryNoteColumns(): ColumnDef<SupplierDeliveryNote>[] {
  const { label } = useTranslations();

  return useMemo(
    () => [
      {
        accessorKey: "number",
        header: headerCell(label("procurement.fields.deliveryNote")),
      },
      {
        accessorKey: "purchase_order_number",
        header: headerCell(label("procurement.fields.lpo")),
      },
      {
        accessorKey: "supplier_name",
        header: headerCell(label("procurement.fields.supplier")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [label]
  );
}

export function useMrnColumns(): ColumnDef<MaterialReceiptNote>[] {
  const { label } = useTranslations();

  return useMemo(
    () => [
      { accessorKey: "number", header: headerCell(label("procurement.fields.mrn")) },
      {
        accessorKey: "purchase_order_number",
        header: headerCell(label("procurement.fields.lpo")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: headerCell(label("procurement.fields.total")),
        cell: ({ row }) => formatAed(row.original.total),
      },
    ],
    [label]
  );
}

export function useSupplierInvoiceColumns(): ColumnDef<SupplierInvoice>[] {
  const { label, t } = useTranslations();

  return useMemo(
    () => [
      {
        accessorKey: "number",
        header: headerCell(label("procurement.fields.invoice")),
      },
      {
        accessorKey: "supplier_name",
        header: headerCell(label("procurement.fields.supplier")),
      },
      {
        accessorKey: "purchase_order_number",
        header: headerCell(label("procurement.fields.lpo")),
      },
      {
        accessorKey: "mrn_number",
        header: headerCell(label("procurement.fields.mrn")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: headerCell(label("procurement.fields.totalInclVat")),
        cell: ({ row }) => formatAed(row.original.total),
      },
      {
        accessorKey: "is_paid",
        header: headerCell(label("common.paid")),
        cell: ({ row }) => (row.original.is_paid ? t("common.yes") : t("common.no")),
      },
    ],
    [label, t]
  );
}

export function usePurchasePaymentColumns(): ColumnDef<PurchasePayment>[] {
  const { label } = useTranslations();

  return useMemo(
    () => [
      {
        accessorKey: "number",
        header: headerCell(label("procurement.fields.payment")),
      },
      {
        accessorKey: "supplier_name",
        header: headerCell(label("procurement.fields.supplier")),
      },
      { accessorKey: "date", header: headerCell(label("procurement.fields.date")) },
      {
        accessorKey: "payment_type",
        header: headerCell(label("procurement.fields.type")),
      },
      {
        accessorKey: "status",
        header: headerCell(label("procurement.fields.status")),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "supplier_invoice_number",
        header: headerCell(label("procurement.fields.invoice")),
        cell: ({ row }) => row.original.supplier_invoice_number ?? "—",
      },
      {
        accessorKey: "amount",
        header: headerCell(label("procurement.fields.amount")),
        cell: ({ row }) => formatAed(row.original.amount),
      },
    ],
    [label]
  );
}
