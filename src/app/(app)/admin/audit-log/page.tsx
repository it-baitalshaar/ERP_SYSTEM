"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { auditLogs } from "@/lib/mock-data/misc";

const columns: ColumnDef<(typeof auditLogs)[0]>[] = [
  { accessorKey: "timestamp", header: "Timestamp" },
  { accessorKey: "user_name", header: "User" },
  { accessorKey: "module", header: "Module" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "entity_id", header: "Entity" },
];

export default function AuditLogPage() {
  return (
    <div>
      <PageHeader title="Audit Log Viewer" description="Searchable log of create/edit/delete actions" />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={auditLogs} searchKey="user_name" />
        </CardContent>
      </Card>
    </div>
  );
}
