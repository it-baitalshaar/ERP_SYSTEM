"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import {
  ProcurementListHeader,
  purchasePaymentColumns,
} from "@/components/modules/procurement-shared";
import {
  createPurchasePayment,
  fetchPurchasePayments,
  fetchSuppliers,
  procurementAction,
} from "@/lib/data/procurement";
import type { PurchasePayment, PurchasePaymentType, Supplier } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function PurchasePaymentsPage() {
  const { currentCompanyId, currentBranchId } = useAppStore();
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>("final");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      fetchPurchasePayments(currentCompanyId),
      fetchSuppliers(currentCompanyId),
    ]);
    setPayments(p);
    setSuppliers(s);
  }, [currentCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setSupplierId(suppliers.find((s) => !s.is_blocked)?.id ?? "");
    setAmount(0);
    setPaymentType("final");
    setReference("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!supplierId) {
      toast.error("Select a supplier");
      return;
    }
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    const result = await createPurchasePayment({
      company_id: currentCompanyId,
      branch_id: currentBranchId,
      supplier_id: supplierId,
      amount,
      payment_type: paymentType,
      reference: reference || undefined,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Payment recorded");
    setDialogOpen(false);
    void load();
  };

  const postPayment = async (id: string) => {
    setActing(id);
    const result = await procurementAction<PurchasePayment>(
      "purchase_payments",
      currentCompanyId,
      id,
      "post"
    );
    setActing(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment posted");
    void load();
  };

  const columns: ColumnDef<PurchasePayment>[] = [
    ...purchasePaymentColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const pay = row.original;
        if (pay.status !== "draft") return null;
        return (
          <Button
            size="sm"
            disabled={acting === pay.id}
            onClick={() => void postPayment(pay.id)}
          >
            <Check className="mr-1 h-3 w-3" />
            Post
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <ProcurementListHeader
        title="Purchase Payments"
        description="Step 8 — advance, on delivery, partial, final, or credit settlement"
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Record payment
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={payments} searchKey="number" />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record purchase payment</DialogTitle>
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
              <Label>Payment type</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as PurchasePaymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="on_delivery">On delivery</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="credit">Credit settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (AED)</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-ref">Reference</Label>
              <Input
                id="pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Bank ref / cheque no."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
