"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/i18n/field-label";
import { DataTable } from "@/components/shared/data-table";
import { ProcurementListHeader, formatAed } from "@/components/modules/procurement-shared";
import { SupplierFormDialog } from "@/components/procurement/supplier-form-dialog";
import { useTranslations } from "@/hooks/use-translations";
import { fetchSuppliers } from "@/lib/data/procurement";
import type { Supplier } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";

export default function SuppliersPage() {
  const { companyId } = useDocumentContext();
  const { t, label } = useTranslations();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSuppliers(companyId);
    setSuppliers(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: () => label("procurement.fields.supplier"),
    },
    {
      accessorKey: "classification",
      header: () => label("procurement.fields.class"),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.classification.toUpperCase()}</Badge>
      ),
    },
    {
      accessorKey: "phone",
      header: () => label("procurement.fields.phone"),
    },
    {
      accessorKey: "payment_terms",
      header: () => label("procurement.fields.terms"),
    },
    {
      accessorKey: "credit_days",
      header: () => label("procurement.fields.creditDays"),
    },
    {
      accessorKey: "outstanding_balance",
      header: () => label("procurement.fields.balanceDue"),
      cell: ({ row }) => formatAed(row.original.outstanding_balance ?? 0),
    },
    {
      accessorKey: "is_blocked",
      header: () => label("procurement.fields.status"),
      cell: ({ row }) =>
        row.original.is_blocked ? (
          <Badge variant="destructive">{t("common.blocked")}</Badge>
        ) : (
          <Badge variant="outline" className="border-success/30 text-success">
            {t("common.active")}
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
          <Pencil className="me-1 h-3 w-3" />
          {t("common.edit")}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title={<BilingualText labelKey="procurement.pages.suppliers.title" />}
        description={
          loading ? (
            t("common.loading")
          ) : (
            <BilingualText labelKey="procurement.pages.suppliers.description" />
          )
        }
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="me-2 h-4 w-4" />
            {t("procurement.pages.suppliers.new")}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={suppliers}
            searchKey="name"
            searchPlaceholder={t("procurement.pages.suppliers.search")}
          />
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        supplier={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
