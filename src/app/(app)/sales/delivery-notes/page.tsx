"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { deliveryNoteToPrintable } from "@/lib/documents/mappers";
import { SalesListHeader, deliveryNoteColumns } from "@/components/modules/sales-shared";
import { fetchDeliveryNotes, salesAction } from "@/lib/data/sales";
import type { DeliveryNote } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { toast } from "sonner";

export default function DeliveryNotesPage() {
  const { companyId, branchId } = useDocumentContext();
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setNotes(await fetchDeliveryNotes(companyId, branchId));
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const postNote = async (id: string) => {
    setActing(id);
    const result = await salesAction<DeliveryNote>(
      "delivery_notes",
      companyId,
      id,
      "post"
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Delivery note posted — stock deducted");
    void load();
  };

  const columns: ColumnDef<DeliveryNote>[] = [
    ...deliveryNoteColumns,
    createPrintColumn(deliveryNoteToPrintable),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const note = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {note.status === "draft" && (
              <Button
                size="sm"
                disabled={acting === note.id}
                onClick={() => void postNote(note.id)}
              >
                <Send className="mr-1 h-3 w-3" />
                Post & deduct stock
              </Button>
            )}
            <AdminDocumentDeleteButton
              module="sales"
              resource="delivery_notes"
              documentId={note.id}
              companyId={companyId}
              onDeleted={() => void load()}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <SalesListHeader
        title="Delivery Notes"
        description="Outbound delivery from posted invoices — posting deducts warehouse stock"
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={notes} searchKey="number" />
        </CardContent>
      </Card>
    </div>
  );
}
