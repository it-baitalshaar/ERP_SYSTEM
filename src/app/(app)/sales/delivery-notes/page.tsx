"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { SalesListHeader, deliveryNoteColumns } from "@/components/modules/sales-shared";
import { fetchDeliveryNotes, salesAction } from "@/lib/data/sales";
import type { DeliveryNote } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function DeliveryNotesPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setNotes(await fetchDeliveryNotes(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const postNote = async (id: string) => {
    setActing(id);
    const result = await salesAction<DeliveryNote>(
      "delivery_notes",
      currentCompanyId,
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const note = row.original;
        if (note.status !== "draft") return null;
        return (
          <Button
            size="sm"
            disabled={acting === note.id}
            onClick={() => void postNote(note.id)}
          >
            <Send className="mr-1 h-3 w-3" />
            Post & deduct stock
          </Button>
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
