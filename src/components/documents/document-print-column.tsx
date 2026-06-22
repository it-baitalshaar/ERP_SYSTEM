"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DocumentPrintActions } from "@/components/documents/document-print-actions";
import { usePrintContext } from "@/components/documents/use-print-context";
import type { PrintableDocument, PrintContext } from "@/lib/documents/types";

function PrintCell<T>({
  row,
  toPrintable,
}: {
  row: T;
  toPrintable: (row: T, ctx: PrintContext) => PrintableDocument;
}) {
  const ctx = usePrintContext();
  return <DocumentPrintActions document={toPrintable(row, ctx)} />;
}

/** Reusable data-table column — Print + PDF on every document row. */
export function createPrintColumn<T>(
  toPrintable: (row: T, ctx: PrintContext) => PrintableDocument
): ColumnDef<T> {
  return {
    id: "print",
    header: "Print / Share",
    cell: ({ row }) => <PrintCell row={row.original} toPrintable={toPrintable} />,
  };
}
