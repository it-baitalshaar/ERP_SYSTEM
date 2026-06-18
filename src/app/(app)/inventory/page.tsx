"use client";

import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { items, stockLevels, warehouses } from "@/lib/mock-data/inventory";

export default function InventoryDashboardPage() {
  const lowStock = stockLevels.filter((s) => s.qty_on_hand <= s.reorder_level);

  return (
    <div>
      <PageHeader title="Inventory Dashboard" description="Stock value, alerts, and slow-moving items" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Total Stock Value" value="AED 2.4M" icon={Package} />
        <KpiCard title="Low Stock Items" value={String(lowStock.length)} icon={AlertTriangle} />
        <KpiCard title="Slow Moving (90d)" value="8" icon={TrendingDown} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStock.map((s) => {
              const item = items.find((i) => i.id === s.item_id);
              const wh = warehouses.find((w) => w.id === s.warehouse_id);
              return (
                <div key={`${s.item_id}-${s.warehouse_id}`} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{item?.name}</p>
                    <p className="text-sm text-muted-foreground">{wh?.name}</p>
                  </div>
                  <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
                    {s.qty_on_hand} / {s.reorder_level} reorder
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
