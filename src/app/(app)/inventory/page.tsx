"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { InventoryListHeader } from "@/components/modules/inventory-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchItems, fetchStockLevels } from "@/lib/data/inventory";
import { useAppStore } from "@/stores/app-store";

export default function InventoryDashboardPage() {
  const currentCompanyId = useAppStore((s) => s.currentCompanyId);
  const [lowStock, setLowStock] = useState<
    { item_name: string; warehouse_name: string; qty_on_hand: number; reorder_level: number }[]
  >([]);
  const [itemCount, setItemCount] = useState(0);
  const [stockValue, setStockValue] = useState(0);

  useEffect(() => {
    void (async () => {
      const [items, levels] = await Promise.all([
        fetchItems(currentCompanyId),
        fetchStockLevels(currentCompanyId),
      ]);
      setItemCount(items.length);
      const priceMap = new Map(items.map((i) => [i.id, i.unit_price]));
      const value = levels.reduce(
        (sum, l) => sum + l.qty_on_hand * (priceMap.get(l.item_id) ?? 0),
        0
      );
      setStockValue(value);
      setLowStock(
        levels
          .filter((l) => l.qty_on_hand <= l.reorder_level && l.reorder_level > 0)
          .map((l) => ({
            item_name: l.item_name,
            warehouse_name: l.warehouse_name,
            qty_on_hand: l.qty_on_hand,
            reorder_level: l.reorder_level,
          }))
      );
    })();
  }, [currentCompanyId]);

  return (
    <div>
      <InventoryListHeader
        title="Inventory Dashboard"
        description="Stock value, alerts, and slow-moving items"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Catalog Items" value={String(itemCount)} icon={Package} />
        <KpiCard title="Stock Value (est.)" value={`AED ${stockValue.toLocaleString()}`} icon={Package} />
        <KpiCard title="Low Stock Lines" value={String(lowStock.length)} icon={AlertTriangle} />
        <KpiCard title="Slow Moving (90d)" value="—" icon={TrendingDown} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">No low-stock alerts — post an MRN to create stock levels.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{s.item_name}</p>
                    <p className="text-sm text-muted-foreground">{s.warehouse_name}</p>
                  </div>
                  <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
                    {s.qty_on_hand} / {s.reorder_level} reorder
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
