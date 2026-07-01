"use client";

import { MessageCircle, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchCustomerProductBlocks, salesAction } from "@/lib/data/sales";
import { buildBlockReminderMessage } from "@/lib/sales/customer-blocks";
import { openWhatsApp } from "@/lib/documents/whatsapp";
import type { Customer, CustomerProductBlock } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerProductBlocksPanelProps {
  customer: Customer;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

function statusBadge(status: CustomerProductBlock["status"]) {
  if (status === "active") return <Badge className="bg-amber-600">Active</Badge>;
  if (status === "released") return <Badge variant="secondary">Released</Badge>;
  return <Badge variant="outline">Expired</Badge>;
}

export function CustomerProductBlocksPanel({
  customer,
  companyId,
  open,
  onOpenChange,
  onUpdated,
}: CustomerProductBlocksPanelProps) {
  const companyName = useAppStore((s) => s.getCurrentCompany()?.name);
  const [blocks, setBlocks] = useState<CustomerProductBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setBlocks(await fetchCustomerProductBlocks(companyId, { customerId: customer.id }));
    setLoading(false);
  }, [companyId, customer.id]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const release = async (blockId: string) => {
    const result = await salesAction("customer_product_blocks", companyId, blockId, "release");
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Reservation released");
    void load();
    onUpdated?.();
  };

  const remind = async (block: CustomerProductBlock) => {
    if (!block.customer_phone) {
      toast.error("Customer has no phone number");
      return;
    }
    const message = buildBlockReminderMessage({
      customerName: customer.name,
      itemName: block.item_name ?? "Product",
      qty: block.qty,
      blockedUntil: block.blocked_until,
      companyName,
    });
    openWhatsApp(block.customer_phone, message);
    await salesAction("customer_product_blocks", companyId, block.id, "mark_reminder_sent");
    toast.success("WhatsApp reminder opened");
    void load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product reservations — {customer.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Active holds, expired history, and WhatsApp reminders for reserved stock.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reservations for this customer.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {block.item_sku} — {block.item_name}
                  </p>
                  <p className="text-muted-foreground">
                    Qty {block.qty} · until{" "}
                    {new Date(block.blocked_until).toLocaleString()}
                  </p>
                  {block.invoice_number && (
                    <p className="text-xs text-muted-foreground">Invoice {block.invoice_number}</p>
                  )}
                  {block.reason && (
                    <p className="text-xs text-muted-foreground">{block.reason}</p>
                  )}
                  {block.reminder_sent_at && (
                    <p className="text-xs text-muted-foreground">
                      Reminder sent {new Date(block.reminder_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {statusBadge(block.status)}
                  {block.status === "active" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => void remind(block)}>
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void release(block.id)}>
                        <Unlock className="mr-1 h-3 w-3" />
                        Release
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
