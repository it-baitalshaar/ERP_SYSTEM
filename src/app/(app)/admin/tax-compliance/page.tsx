"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TaxCompliancePage() {
  return (
    <div>
      <PageHeader title="Tax & Compliance Settings" description="VAT rates, TRN, UAE e-Invoicing ASP config" comingSoon />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Default VAT Rate (%)</Label>
            <Input defaultValue="5" disabled />
          </div>
          <div className="space-y-2">
            <Label>TRN Number</Label>
            <Input defaultValue="100123456700003" disabled />
          </div>
          <div className="space-y-2">
            <Label>FTA Accredited Service Provider</Label>
            <Input placeholder="Select ASP..." disabled />
          </div>
          <ComingSoonButton>Save Settings</ComingSoonButton>
        </CardContent>
      </Card>
    </div>
  );
}
