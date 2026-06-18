"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import type { ColumnDef } from "@tanstack/react-table";

export interface ModulePageConfig {
  title: string;
  description?: string;
  comingSoon?: boolean;
  columns?: ColumnDef<Record<string, unknown>>[];
  data?: Record<string, unknown>[];
  searchKey?: string;
  children?: React.ReactNode;
}

export function ModulePage({ config }: { config: ModulePageConfig }) {
  return (
    <div>
      <PageHeader title={config.title} description={config.description} comingSoon={config.comingSoon} />
      {config.children}
      {config.columns && config.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Records</CardTitle>
            <CardDescription>Sample data — backend integration pending</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={config.columns} data={config.data} searchKey={config.searchKey} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
