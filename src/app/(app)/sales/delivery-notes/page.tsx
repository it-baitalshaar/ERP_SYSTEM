"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { SalesListHeader } from "@/components/modules/sales-shared";
import { deliveryNotes } from "@/lib/mock-data/sales";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DeliveryNote } from "@/lib/types";

const columns: ColumnDef<DeliveryNote>[] = [
  { accessorKey: "number", header: "Number" },
  { accessorKey: "invoice_id", header: "Invoice" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function DeliveryNotesPage() {
  return (
    <div>
      <SalesListHeader title="Delivery Notes" description="Electronic delivery notes — triggers stock deduction" />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={deliveryNotes} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
