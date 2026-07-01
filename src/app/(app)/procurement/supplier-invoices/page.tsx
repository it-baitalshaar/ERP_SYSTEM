"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Scale } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/i18n/field-label";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { supplierInvoiceToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  useSupplierInvoiceColumns,
} from "@/components/modules/procurement-shared";
import { SupplierInvoiceFormDialog } from "@/components/procurement/supplier-invoice-form-dialog";
import { SupplierInvoicePostDialog } from "@/components/procurement/supplier-invoice-post-dialog";
import { ThreeWayMatchPanel } from "@/components/procurement/three-way-match-panel";
import {
  fetchSupplierInvoices,
  fetchSuppliers,
  fetchThreeWayMatch,
  procurementAction,
} from "@/lib/data/procurement";
import type { ThreeWayMatchResult } from "@/lib/procurement/three-way-match";
import type { Supplier, SupplierInvoice } from "@/lib/types";
import { useDocumentContext } from "@/hooks/use-document-context";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "sonner";

export default function SupplierInvoicesPage() {
  const { companyId, branchId } = useDocumentContext();
  const { t, label } = useTranslations();
  const supplierInvoiceColumns = useSupplierInvoiceColumns();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [matchData, setMatchData] = useState<ThreeWayMatchResult | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [i, s] = await Promise.all([
      fetchSupplierInvoices(companyId, branchId),
      fetchSuppliers(companyId),
    ]);
    setInvoices(i);
    setSuppliers(s);
  }, [companyId, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openMatch = async (inv: SupplierInvoice) => {
    if (!inv.mrn_id) {
      toast.message(t("procurement.pages.supplierInvoices.notLinkedMrn"));
      return;
    }
    setSelectedInvoice(inv);
    setMatchData(null);
    setMatchOpen(true);
    const result = await fetchThreeWayMatch(companyId, { supplierInvoiceId: inv.id });
    if (result.error) {
      toast.error(result.error);
      setMatchOpen(false);
      return;
    }
    setMatchData(result.data ?? null);
  };

  const columns: ColumnDef<SupplierInvoice>[] = [
    ...supplierInvoiceColumns,
    createPrintColumn(supplierInvoiceToPrintable),
    {
      id: "actions",
      header: () => label("common.actions"),
      cell: ({ row }) => {
        const inv = row.original;
        const busy = acting === inv.id;
        return (
          <div className="flex flex-wrap gap-1">
            {inv.status === "draft" && (
              <>
                {inv.mrn_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void openMatch(inv)}
                  >
                    <Scale className="me-1 h-3 w-3" />
                    {t("procurement.pages.supplierInvoices.threeWay")}
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setSelectedInvoice(inv);
                    setPostOpen(true);
                  }}
                >
                  <Check className="me-1 h-3 w-3" />
                  {t("procurement.pages.supplierInvoices.post")}
                </Button>
              </>
            )}
            {inv.status === "posted" && !inv.is_paid && (
              <span className="self-center px-1 text-xs text-muted-foreground">
                {t("procurement.pages.supplierInvoices.payViaPayments")}
              </span>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="supplier_invoices"
              documentId={inv.id}
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
      <ProcurementListHeader
        title={<BilingualText labelKey="procurement.pages.supplierInvoices.title" />}
        description={<BilingualText labelKey="procurement.pages.supplierInvoices.description" />}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t("procurement.pages.supplierInvoices.new")}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={invoices} searchKey="number" />
        </CardContent>
      </Card>

      <SupplierInvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        branchId={branchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />

      <SupplierInvoicePostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        companyId={companyId}
        invoice={selectedInvoice}
        onPosted={() => void load()}
      />

      <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("procurement.pages.supplierInvoices.threeWayTitle")} — {selectedInvoice?.number}
            </DialogTitle>
          </DialogHeader>
          {matchData ? (
            <ThreeWayMatchPanel match={matchData} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
