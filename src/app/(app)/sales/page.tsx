"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salesOrderColumns } from "@/components/modules/sales-shared";
import type { SalesOrder } from "@/lib/types";
import { fetchSalesOrders } from "@/lib/data/sales";
import { useDocumentContext } from "@/hooks/use-document-context";

export default function SalesDashboardPage() {
  const { companyId, branchId } = useDocumentContext();
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    void fetchSalesOrders(companyId, branchId).then(setOrders);
  }, [companyId, branchId]);

  return (
    <div>
      <PageHeader title="Sales Dashboard" description="KPIs and recent orders — AL SAQIYA TRADING" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Revenue (MTD)" value="AED 423,939" icon={DollarSign} trend={{ value: "+15%", positive: true }} />
        <KpiCard title="Open Orders" value={String(orders.filter((o) => o.status !== "posted").length)} icon={ShoppingCart} />
        <KpiCard title="Conversion Rate" value="68%" icon={TrendingUp} />
        <KpiCard title="Orders Loaded" value={String(orders.length)} icon={Users} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sales Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={salesOrderColumns} data={orders} searchKey="customer_name" searchPlaceholder="Search customer..." />
        </CardContent>
      </Card>
    </div>
  );
}
