"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  BelowCostLineHint,
  BelowCostSummaryAlert,
} from "@/components/sales/below-cost-warning";
import { ProductWarehouseAvailability } from "@/components/sales/product-warehouse-availability";
import { documentTotal } from "@/lib/sales/calculations";
import {
  BELOW_COST_WARNING_FLAG,
  findBelowCostLines,
} from "@/lib/sales/below-cost";
import {
  indexStockByItem,
  PRODUCT_WAREHOUSE_AVAILABILITY_FLAG,
  type WarehouseAvailability,
} from "@/lib/sales/warehouse-availability";
import { getSalesCatalog } from "@/lib/sales/catalog";
import {
  createQuotation,
  createSalesOrder,
  createTaxInvoice,
  fetchCustomerProductBlocks,
} from "@/lib/data/sales";
import { fetchStockLevels } from "@/lib/data/inventory";
import { CUSTOMER_PRODUCT_BLOCKS_FLAG } from "@/lib/sales/customer-blocks";
import type { Customer, CustomerProductBlock, Item, LineItem, StockLevelRow } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export type SalesDocumentKind = "quotation" | "order" | "invoice";

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: SalesDocumentKind;
  companyId: string;
  branchId: string;
  customers: Customer[];
  onCreated: () => void;
}

const emptyLine = (): LineItem => ({
  item_id: "",
  item_name: "",
  qty: 1,
  uom: "pcs",
  unit_price: 0,
  discount_pct: 0,
  vat_pct: 5,
});

const kindLabels: Record<SalesDocumentKind, string> = {
  quotation: "Quotation",
  order: "Sales order",
  invoice: "Tax invoice",
};

export function DocumentFormDialog({
  open,
  onOpenChange,
  kind,
  companyId,
  branchId,
  customers,
  onCreated,
}: DocumentFormDialogProps) {
  const belowCostWarningEnabled = useAppStore((s) =>
    s.isFeatureEnabled(BELOW_COST_WARNING_FLAG)
  );
  const warehouseAvailabilityEnabled = useAppStore((s) =>
    s.isFeatureEnabled(PRODUCT_WAREHOUSE_AVAILABILITY_FLAG)
  );
  const customerBlocksEnabled = useAppStore((s) =>
    s.isFeatureEnabled(CUSTOMER_PRODUCT_BLOCKS_FLAG)
  );
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelRow[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<CustomerProductBlock[]>([]);
  const activeCustomers = useMemo(
    () => customers.filter((c) => !c.is_blocked),
    [customers]
  );

  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [confirmBelowCostOpen, setConfirmBelowCostOpen] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    void getSalesCatalog(companyId).then(setCatalog);
    if (warehouseAvailabilityEnabled) {
      void fetchStockLevels(companyId).then(setStockLevels);
    } else {
      setStockLevels([]);
    }
    if (customerBlocksEnabled) {
      void fetchCustomerProductBlocks(companyId, { activeOnly: true }).then(setActiveBlocks);
    } else {
      setActiveBlocks([]);
    }
  }, [open, companyId, warehouseAvailabilityEnabled, customerBlocksEnabled]);

  const stockByItem = useMemo(
    () => (warehouseAvailabilityEnabled ? indexStockByItem(stockLevels) : new Map()),
    [warehouseAvailabilityEnabled, stockLevels]
  );

  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!justOpened) return;

    setCustomerId(customers.find((c) => !c.is_blocked)?.id ?? "");
    setValidUntil("");
    setLines([emptyLine()]);
    setConfirmBelowCostOpen(false);
  }, [open, customers]);

  const belowCostWarnings = useMemo(() => {
    if (!belowCostWarningEnabled) return [];
    return findBelowCostLines(lines, catalog);
  }, [belowCostWarningEnabled, lines, catalog]);

  const warningByIndex = useMemo(
    () => new Map(belowCostWarnings.map((w) => [w.index, w])),
    [belowCostWarnings]
  );

  const total = documentTotal(lines);

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const pickCatalogItem = (index: number, itemId: string) => {
    const item = catalog.find((c) => c.id === itemId);
    if (!item) return;
    updateLine(index, {
      item_id: item.id,
      item_name: item.name,
      uom: item.base_uom,
      unit_price: item.unit_price,
      vat_pct: 5,
    });
  };

  const submitDocument = async (acknowledgeBelowCost: boolean) => {
    setSaving(true);
    const payload = {
      company_id: companyId,
      branch_id: branchId,
      customer_id: customerId,
      lines,
      acknowledge_below_cost: acknowledgeBelowCost,
    };

    let result;
    if (kind === "quotation") {
      result = await createQuotation({
        ...payload,
        valid_until: validUntil || undefined,
      });
    } else if (kind === "order") {
      result = await createSalesOrder(payload);
    } else {
      result = await createTaxInvoice(payload);
    }

    setSaving(false);

    if (result.code === "below_cost_warning") {
      setConfirmBelowCostOpen(true);
      return;
    }

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${kindLabels[kind]} created`);
    setConfirmBelowCostOpen(false);
    onCreated();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    if (!branchId) {
      toast.error("Select a branch in the top bar");
      return;
    }

    if (belowCostWarningEnabled && belowCostWarnings.length > 0) {
      setConfirmBelowCostOpen(true);
      return;
    }

    await submitDocument(false);
  };

  const handleConfirmBelowCost = async () => {
    await submitDocument(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New {kindLabels[kind]}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={customerId || undefined}
                  onValueChange={setCustomerId}
                  disabled={activeCustomers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeCustomers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Create a customer first before raising a {kindLabels[kind].toLowerCase()}.
                  </p>
                )}
              </div>
              {kind === "quotation" && (
                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid until</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              )}
            </div>

            {belowCostWarningEnabled && (
              <BelowCostSummaryAlert warnings={belowCostWarnings} />
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add line
                </Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`grid gap-2 rounded-md border p-3 md:grid-cols-6 ${
                    warningByIndex.has(index)
                      ? "border-amber-400 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
                      : ""
                  }`}
                >
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select
                      value={line.item_id ? line.item_id : undefined}
                      onValueChange={(id) => pickCatalogItem(index, id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick from catalog" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.map((item) => {
                          const availTotal = warehouseAvailabilityEnabled
                            ? (stockByItem.get(item.id) ?? []).reduce(
                                (sum: number, w: WarehouseAvailability) =>
                                  sum + w.qty_available,
                                0
                              )
                            : null;
                          return (
                            <SelectItem key={item.id} value={item.id}>
                              {item.sku} — {item.name}
                              {warehouseAvailabilityEnabled &&
                                ` · ${availTotal} avail`}
                              {(item.cost_price ?? 0) > 0
                                ? ` (cost ${item.cost_price})`
                                : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or type item name"
                      value={line.item_name}
                      onChange={(e) => updateLine(index, { item_name: e.target.value })}
                    />
                    {belowCostWarningEnabled && (
                      <BelowCostLineHint warning={warningByIndex.get(index)} />
                    )}
                    {warehouseAvailabilityEnabled && line.item_id && (
                      <ProductWarehouseAvailability
                        itemId={line.item_id}
                        itemName={line.item_name}
                        uom={line.uom}
                        warehouses={stockByItem.get(line.item_id) ?? []}
                      />
                    )}
                    {customerBlocksEnabled && line.item_id && customerId && (
                      <>
                        {activeBlocks
                          .filter(
                            (b) =>
                              b.item_id === line.item_id && b.customer_id !== customerId
                          )
                          .map((b) => (
                            <p
                              key={b.id}
                              className="text-xs text-amber-700 dark:text-amber-300"
                            >
                              Reserved for {b.customer_name}: {b.qty} until{" "}
                              {new Date(b.blocked_until).toLocaleDateString()}
                            </p>
                          ))}
                        {activeBlocks
                          .filter(
                            (b) =>
                              b.item_id === line.item_id && b.customer_id === customerId
                          )
                          .map((b) => (
                            <p
                              key={b.id}
                              className="text-xs text-emerald-700 dark:text-emerald-300"
                            >
                              Your reservation: {b.qty} until{" "}
                              {new Date(b.blocked_until).toLocaleDateString()}
                            </p>
                          ))}
                      </>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={line.qty}
                      onChange={(e) => updateLine(index, { qty: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">UOM</Label>
                    <Input
                      value={line.uom}
                      onChange={(e) => updateLine(index, { uom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit price</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(index, { unit_price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Disc %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={line.discount_pct}
                        onChange={(e) =>
                          updateLine(index, { discount_pct: Number(e.target.value) })
                        }
                      />
                    </div>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end text-sm font-medium">
              Total (incl. VAT): AED {total.toLocaleString()}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Creating…" : `Create ${kindLabels[kind]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBelowCostOpen} onOpenChange={setConfirmBelowCostOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selling below purchase cost</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            One or more lines are priced below the item&apos;s purchase (cost) price. This may be
            unintentional if the selling price was not updated after goods receipt.
          </p>
          <BelowCostSummaryAlert warnings={belowCostWarnings} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBelowCostOpen(false)}>
              Go back and fix prices
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmBelowCost()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Proceed anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
