"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { InventoryListHeader, itemColumns } from "@/components/modules/inventory-shared";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";
import { fetchItems } from "@/lib/data/inventory";
import type { Item } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function ItemsPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [items, setItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchItems(currentCompanyId));
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<Item>[] = [
    ...itemColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(row.original);
            setDialogOpen(true);
          }}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <InventoryListHeader
        title="Items / Products"
        description="Building materials catalog — tiles, cement, steel, etc."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={items} searchKey="name" searchPlaceholder="Search items..." />
        </CardContent>
      </Card>

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={currentCompanyId}
        item={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
