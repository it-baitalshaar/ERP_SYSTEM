"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BackupHealthPage() {
  return (
    <div>
      <PageHeader title="Backup & System Health" description="Backup status and system uptime" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup Status</CardTitle>
            <CardDescription>Last backup: 2026-06-14 02:00 UTC</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="mb-4 border-success/30 bg-success/10 text-success">Healthy</Badge>
            <ComingSoonButton>Run Backup Now</ComingSoonButton>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">99.9%</p>
            <p className="text-sm text-muted-foreground">30-day SLA</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
