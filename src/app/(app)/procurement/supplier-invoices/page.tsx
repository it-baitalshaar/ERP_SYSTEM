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
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { supplierInvoiceToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  supplierInvoiceColumns,
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
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function SupplierInvoicesPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
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
      fetchSupplierInvoices(currentCompanyId),
      fetchSuppliers(currentCompanyId),
    ]);
    setInvoices(i);
    setSuppliers(s);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await procurementAction<SupplierInvoice>(
      "supplier_invoices",
      currentCompanyId,
      id,
      action
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    void load();
  };

  const openMatch = async (inv: SupplierInvoice) => {
    if (!inv.mrn_id) {
      toast.message("This invoice is not linked to an MRN");
      return;
    }
    setSelectedInvoice(inv);
    setMatchData(null);
    setMatchOpen(true);
    const result = await fetchThreeWayMatch(currentCompanyId, { supplierInvoiceId: inv.id });
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
      header: "Actions",
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
                    <Scale className="mr-1 h-3 w-3" />
                    3-way
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
                  <Check className="mr-1 h-3 w-3" />
                  Post
                </Button>
              </>
            )}
            {inv.status === "posted" && !inv.is_paid && (
              <span className="text-xs text-muted-foreground self-center px-1">
                Pay via Purchase Payments
              </span>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="supplier_invoices"
              documentId={inv.id}
              companyId={currentCompanyId}
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
        title="Supplier Invoices"
        description="Step 7 — supplier tax invoice; 3-way match vs LPO and MRN"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New invoice
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
        companyId={currentCompanyId}
        branchId={currentBranchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />

      <SupplierInvoicePostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        companyId={currentCompanyId}
        invoice={selectedInvoice}
        onPosted={() => void load()}
      />

      <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>3-way match — {selectedInvoice?.number}</DialogTitle>
          </DialogHeader>
          {matchData ? (
            <ThreeWayMatchPanel match={matchData} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
