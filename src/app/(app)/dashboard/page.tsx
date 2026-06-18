"use client";

import { DollarSign, Package, TrendingUp, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const salesTrend = [
  { month: "Jan", revenue: 420000 },
  { month: "Feb", revenue: 380000 },
  { month: "Mar", revenue: 510000 },
  { month: "Apr", revenue: 470000 },
  { month: "May", revenue: 620000 },
  { month: "Jun", revenue: 580000 },
];

const branchComparison = [
  { branch: "DXB", sales: 320000 },
  { branch: "AUH", sales: 180000 },
  { branch: "SHJ", sales: 80000 },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Group-wide KPIs — AED currency, consolidated view"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Revenue (MTD)" value="AED 580,000" icon={DollarSign} trend={{ value: "+12% vs last month", positive: true }} />
        <KpiCard title="Gross Profit" value="AED 145,000" icon={TrendingUp} trend={{ value: "+8% vs last month", positive: true }} />
        <KpiCard title="Inventory Value" value="AED 2.4M" icon={Package} subtitle="Across all warehouses" />
        <KpiCard title="Open Projects" value="7" icon={FolderKanban} subtitle="3 construction, 4 real estate" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="branch" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, "Sales"]} />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
