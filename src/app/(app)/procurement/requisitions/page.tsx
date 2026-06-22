"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus, Send } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { createPrintColumn } from "@/components/documents/document-print-column";
import { AdminDocumentDeleteButton } from "@/components/documents/admin-document-delete-button";
import { materialRequestToPrintable } from "@/lib/documents/mappers";
import {
  ProcurementListHeader,
  materialRequestColumns,
} from "@/components/modules/procurement-shared";
import { PurchaseDocumentFormDialog } from "@/components/procurement/purchase-document-form-dialog";
import {
  fetchMaterialRequests,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { MaterialRequest, PurchasePaymentTerms, Supplier } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function MaterialRequestsPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertMrId, setConvertMrId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PurchasePaymentTerms>("credit");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetchMaterialRequests(currentCompanyId),
      fetchSuppliers(currentCompanyId),
    ]);
    setRequests(r);
    setSuppliers(s);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: string, success: string) => {
    setActing(id);
    const result = await procurementAction<MaterialRequest>(
      "material_requests",
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

  const handleConvert = async () => {
    if (!convertMrId || !supplierId) {
      toast.error("Select a supplier");
      return;
    }
    setActing(convertMrId);
    const result = await procurementAction(
      "material_requests",
      currentCompanyId,
      convertMrId,
      "convert_to_lpo",
      { supplier_id: supplierId, payment_terms_type: paymentTerms }
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("LPO created from material request");
    setConvertOpen(false);
    void load();
  };

  const columns: ColumnDef<MaterialRequest>[] = [
    ...materialRequestColumns,
    createPrintColumn(materialRequestToPrintable),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mr = row.original;
        const busy = acting === mr.id;
        return (
          <div className="flex flex-wrap gap-1">
            {mr.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runAction(mr.id, "submit", "Submitted for approval")}
              >
                <Send className="mr-1 h-3 w-3" />
                Submit
              </Button>
            )}
            {(mr.status === "draft" || mr.status === "pending_approval") && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runAction(mr.id, "approve", "Material request approved")}
              >
                Approve
              </Button>
            )}
            {mr.status === "approved" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  setConvertMrId(mr.id);
                  setSupplierId(suppliers.find((s) => !s.is_blocked)?.id ?? "");
                  setConvertOpen(true);
                }}
              >
                <ArrowRight className="mr-1 h-3 w-3" />
                To LPO
              </Button>
            )}
            <AdminDocumentDeleteButton
              module="procurement"
              resource="material_requests"
              documentId={mr.id}
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
        title="Material Requests"
        description="Step 1 — request materials, authorize, then convert to LPO"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={requests} searchKey="number" />
        </CardContent>
      </Card>

      <PurchaseDocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind="material_request"
        companyId={currentCompanyId}
        branchId={currentBranchId}
        suppliers={suppliers}
        onCreated={() => void load()}
      />

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to LPO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId || undefined} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s) => !s.is_blocked)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment timing</Label>
              <Select
                value={paymentTerms}
                onValueChange={(v) => setPaymentTerms(v as PurchasePaymentTerms)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="on_delivery">On delivery</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleConvert()} disabled={acting !== null}>
              Create LPO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
