"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ProcurementListHeader } from "@/components/modules/procurement-shared";
import { SupplierFormDialog } from "@/components/procurement/supplier-form-dialog";
import { fetchSuppliers } from "@/lib/data/procurement";
import type { Supplier } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export default function SuppliersPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSuppliers(currentCompanyId);
    setSuppliers(data);
    setLoading(false);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: "name", header: "Supplier" },
    {
      accessorKey: "classification",
      header: "Class",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.classification.toUpperCase()}</Badge>
      ),
    },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "payment_terms", header: "Terms" },
    { accessorKey: "credit_days", header: "Credit days" },
    {
      accessorKey: "is_blocked",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_blocked ? (
          <Badge variant="destructive">Blocked</Badge>
        ) : (
          <Badge variant="outline" className="border-success/30 text-success">
            Active
          </Badge>
        ),
    },
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
      <ProcurementListHeader
        title="Suppliers"
        description={
          loading ? "Loading…" : "Vendor master — payment terms, currency, classification"
        }
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New supplier
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={suppliers}
            searchKey="name"
            searchPlaceholder="Search suppliers..."
          />
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={currentCompanyId}
        supplier={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
