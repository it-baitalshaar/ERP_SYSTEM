"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { CustomerFormDialog } from "@/components/sales/customer-form-dialog";
import { AdminCustomerDeleteButton } from "@/components/sales/admin-customer-delete-button";
import { SalesListHeader, formatAed } from "@/components/modules/sales-shared";
import type { Customer } from "@/lib/types";
import { fetchCustomers } from "@/lib/data/sales";
import { useDocumentContext } from "@/hooks/use-document-context";

export default function CustomersPage() {
  const { companyId } = useDocumentContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCustomers(companyId);
    setCustomers(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Customer" },
    {
      accessorKey: "classification",
      header: "Class",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.classification.toUpperCase()}</Badge>
      ),
    },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "credit_limit",
      header: "Credit Limit",
      cell: ({ row }) => formatAed(row.original.credit_limit),
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => formatAed(row.original.outstanding_balance),
    },
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
        <div className="flex flex-wrap gap-1">
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
          <AdminCustomerDeleteButton
            customerId={row.original.id}
            companyId={companyId}
            onDeleted={() => void load()}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <SalesListHeader
        title="Customers"
        description={
          loading ? "Loading…" : "Create and manage customer profiles with credit limits"
        }
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New customer
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="Search customers..."
          />
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        customer={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
