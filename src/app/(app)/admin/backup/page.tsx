"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalOrgDataRestore } from "@/components/admin/org-data-lifecycle-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchOrgStructure, type OrgStructure } from "@/lib/data/org-structure";
import { useAppStore } from "@/stores/app-store";

export default function BackupHealthPage() {
  const { organizations, currentOrganizationId, hydrateSession } = useAppStore();
  const [orgId, setOrgId] = useState(currentOrganizationId);
  const [structure, setStructure] = useState<OrgStructure | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    const data = await fetchOrgStructure(orgId);
    setStructure(data);
  }, [orgId]);

  useEffect(() => {
    setOrgId(currentOrganizationId);
  }, [currentOrganizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & data lifecycle"
        description="Export, reset, and restore operational data for shops, departments, branches, and warehouses"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Select which organization to restore data into</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {orgId && (
            <GlobalOrgDataRestore
              organizationId={orgId}
              structure={structure}
              onSuccess={() => {
                void load();
                void hydrateSession();
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where to manage data</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            On <strong>Admin → Organization Structure</strong>, each shop, department, branch, and
            warehouse has a database icon menu with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Export backup</strong> — download a JSON snapshot</li>
            <li><strong>Reset data</strong> — clear operational data and start fresh (structure kept)</li>
            <li><strong>Restore from backup</strong> — reload from your saved JSON file</li>
          </ul>
          <p className="pt-2">
            Reset and restore actions are archived server-side when migration{" "}
            <code className="text-xs">0007_org_data_operations.sql</code> is applied.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
